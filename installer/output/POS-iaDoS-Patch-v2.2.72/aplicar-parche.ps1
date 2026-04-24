param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [string]$PatchDir   = $PSScriptRoot
)
$ErrorActionPreference = "SilentlyContinue"

$NSSM    = "$InstallDir\tools\nssm.exe"
$SVC     = "PosIaDos-Backend"
$VERSION = "2.2.72"

function Write-Step($msg)  { Write-Host "  $msg" -ForegroundColor Yellow }
function Write-Ok($msg)    { Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "    AVISO: $msg" -ForegroundColor Yellow }
function Write-Fail($msg)  { Write-Host "    ERROR: $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "  POS-iaDoS Parche v$VERSION" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path $InstallDir)) {
    Write-Fail "No se encontro el directorio de instalacion: $InstallDir"
    Write-Host "  Si instalaste en otra ruta, ejecuta:" -ForegroundColor White
    Write-Host "  powershell -File aplicar-parche.ps1 -InstallDir C:\tu\ruta" -ForegroundColor Gray
    exit 1
}

Write-Step "Deteniendo servicio backend..."
if (Test-Path $NSSM) {
    & $NSSM stop $SVC 2>&1 | Out-Null
    Start-Sleep 4
    Write-Ok "Servicio detenido"
} else {
    Write-Warn "NSSM no encontrado, continuando"
}

Write-Step "Aplicando migracion de base de datos..."
$sqlFile = "$PatchDir\migration.sql"

if (Test-Path $sqlFile) {
    $envFile = "$InstallDir\backend\.env"
    $dbName  = "pos_iados"
    $dbUser  = "root"
    $dbPass  = ""
    $dbPort  = "3306"

    if (Test-Path $envFile) {
        $envLines = Get-Content $envFile
        foreach ($line in $envLines) {
            if ($line -match '^DB_DATABASE=(.+)')  { $dbName = $matches[1].Trim() }
            if ($line -match '^DB_USERNAME=(.+)')  { $dbUser = $matches[1].Trim() }
            if ($line -match '^DB_PASSWORD=(.+)')  { $dbPass = $matches[1].Trim() }
            if ($line -match '^DB_PORT=(.+)')      { $dbPort = $matches[1].Trim() }
        }
    }

    $mysqlBin = $null
    $candidates = @(
        "$InstallDir\mariadb\bin\mysql.exe",
        "$InstallDir\mysql\bin\mysql.exe",
        "C:\Program Files\MariaDB 10.6\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    )
    foreach ($c in $candidates) { if (Test-Path $c) { $mysqlBin = $c; break } }

    if (-not $mysqlBin) {
        $cmd = Get-Command mysql -ErrorAction SilentlyContinue
        if ($cmd) { $mysqlBin = $cmd.Source }
    }

    if ($mysqlBin) {
        $sqlArgs = @("-u", $dbUser, "-P", $dbPort, "--protocol=TCP", "-f")
        if ($dbPass) { $sqlArgs += "-p$dbPass" }
        $sqlArgs += $dbName

        $result = Get-Content $sqlFile -Raw | & $mysqlBin @sqlArgs 2>&1
        $critical = $result | Where-Object { $_ -match "^ERROR" -and $_ -notmatch "already exists|Duplicate|existe" }
        if ($critical) {
            Write-Warn "Advertencia SQL:"
            $critical | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkYellow }
        } else {
            Write-Ok "Migracion SQL aplicada"
        }
    } else {
        Write-Warn "mysql.exe no encontrado. Aplica manualmente: $sqlFile"
    }
} else {
    Write-Ok "Sin archivo de migracion"
}

Write-Step "Actualizando backend (dist)..."
$srcDist  = "$PatchDir\backend\dist"
$destDist = "$InstallDir\backend\dist"
if (Test-Path $srcDist) {
    if (Test-Path $destDist) { Remove-Item -Recurse -Force $destDist }
    Copy-Item -Path $srcDist -Destination $destDist -Recurse -Force
    Write-Ok "backend\dist actualizado"
} else {
    Write-Warn "No se encontro backend\dist en el parche"
}

Write-Step "Actualizando frontend (public)..."
$srcPub  = "$PatchDir\backend\public"
$destPub = "$InstallDir\backend\public"
if (Test-Path $srcPub) {
    if (Test-Path $destPub) { Remove-Item -Recurse -Force $destPub }
    Copy-Item -Path $srcPub -Destination $destPub -Recurse -Force
    Write-Ok "backend\public actualizado"
} else {
    Write-Warn "No se encontro backend\public en el parche"
}

Write-Step "Actualizando version en .env..."
$envFile2 = "$InstallDir\backend\.env"
if (Test-Path $envFile2) {
    $envContent = Get-Content $envFile2 -Raw
    if ($envContent -match 'APP_VERSION=') {
        $envContent = $envContent -replace 'APP_VERSION=\S*', "APP_VERSION=$VERSION"
    } else {
        $envContent = $envContent.TrimEnd() + "`nAPP_VERSION=$VERSION`n"
    }
    $envContent | Set-Content $envFile2 -Encoding UTF8 -NoNewline
    Write-Ok "APP_VERSION=$VERSION"
}

$vjFile = "$InstallDir\version.json"
if (Test-Path $vjFile) {
    try {
        $vj = Get-Content $vjFile -Raw | ConvertFrom-Json
        $vj.version = $VERSION
        $vj | ConvertTo-Json | Set-Content $vjFile -Encoding UTF8
        Write-Ok "version.json -> v$VERSION"
    } catch {
        Write-Warn "No se pudo actualizar version.json"
    }
}

Write-Step "Reiniciando servicio backend..."
if (Test-Path $NSSM) {
    & $NSSM start $SVC 2>&1 | Out-Null
    Write-Ok "Servicio iniciado"
} else {
    Write-Warn "Inicia el servicio PosIaDos-Backend manualmente"
}

Write-Step "Esperando backend (max 60s)..."
$ok = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep 3
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 3000)
        $tcp.Close()
        $ok = $true
        break
    } catch { }
}

Write-Host ""
Write-Host "  ========================================" -ForegroundColor DarkGray
if ($ok) {
    Write-Host "  PARCHE v$VERSION APLICADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Novedades:" -ForegroundColor White
    Write-Host "   - Devolucion: boton Devolver en POS (busca folio/monto/cliente)" -ForegroundColor Gray
    Write-Host "   - Pre-cuenta: visible en modo mesa, pedidos y cuentas abiertas" -ForegroundColor Gray
    Write-Host "   - Pedidos QR Mesa: llegan a Pedidos con badge QR Mesa" -ForegroundColor Gray
    Write-Host "   - Fix: Worker-poll dual-slug para pedidos de mesas" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Abre http://localhost:3000 en tu navegador" -ForegroundColor Cyan
} else {
    Write-Host "  PARCHE APLICADO - backend no respondio en 60s" -ForegroundColor Yellow
    Write-Host "  Revisa el servicio PosIaDos-Backend en Servicios de Windows" -ForegroundColor Gray
}
Write-Host "  ========================================" -ForegroundColor DarkGray
Write-Host ""
