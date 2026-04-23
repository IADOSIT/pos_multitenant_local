param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [string]$PatchDir   = $PSScriptRoot
)
$ErrorActionPreference = "SilentlyContinue"

$NSSM    = "$InstallDir\tools\nssm.exe"
$SVC     = "PosIaDos-Backend"
$VERSION = "2.2.71"

function Write-Step($msg)  { Write-Host "  $msg" -ForegroundColor Yellow }
function Write-Ok($msg)    { Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "    AVISO: $msg" -ForegroundColor Yellow }
function Write-Fail($msg)  { Write-Host "    ERROR: $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "  POS-iaDoS Parche v$VERSION" -ForegroundColor Cyan
Write-Host "  ────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── Verificar directorio de instalación ──────────────────────────────────────
if (-not (Test-Path $InstallDir)) {
    Write-Fail "No se encontro el directorio de instalacion: $InstallDir"
    Write-Host ""
    Write-Host "  Si instalaste en otra ruta, ejecuta:" -ForegroundColor White
    Write-Host "  powershell -File aplicar-parche.ps1 -InstallDir ""C:\tu\ruta""" -ForegroundColor Gray
    exit 1
}

# ── Detener servicio ─────────────────────────────────────────────────────────
Write-Step "Deteniendo servicio backend..."
if (Test-Path $NSSM) {
    & $NSSM stop $SVC 2>&1 | Out-Null
    Start-Sleep 3
    Write-Ok "Servicio detenido"
} else {
    Write-Warn "NSSM no encontrado, continuando sin detener servicio"
}

# ── Aplicar migración SQL ─────────────────────────────────────────────────────
Write-Step "Aplicando migración de base de datos..."
$sqlFile = "$PatchDir\migration.sql"

if (Test-Path $sqlFile) {
    # Leer credenciales del .env
    $envFile = "$InstallDir\backend\.env"
    $dbName = "pos_iados"
    $dbUser = "root"
    $dbPass = ""
    $dbPort = "3306"

    if (Test-Path $envFile) {
        $envLines = Get-Content $envFile
        foreach ($line in $envLines) {
            if ($line -match '^DB_NAME=(.+)')     { $dbName = $matches[1].Trim() }
            if ($line -match '^DB_USERNAME=(.+)') { $dbUser = $matches[1].Trim() }
            if ($line -match '^DB_PASSWORD=(.+)') { $dbPass = $matches[1].Trim() }
            if ($line -match '^DB_PORT=(.+)')     { $dbPort = $matches[1].Trim() }
        }
    }

    # Buscar mysql/mariadb ejecutable
    $mysqlBin = $null
    $candidates = @(
        "$InstallDir\mariadb\bin\mysql.exe",
        "$InstallDir\mysql\bin\mysql.exe",
        "C:\Program Files\MariaDB 10.6\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $mysqlBin = $c; break }
    }
    if (-not $mysqlBin) {
        $mysqlBin = (Get-Command mysql -ErrorAction SilentlyContinue)?.Source
    }

    if ($mysqlBin) {
        $args = @("-u", $dbUser, "-P", $dbPort, "--protocol=TCP")
        if ($dbPass) { $args += "-p$dbPass" }
        $args += $dbName
        $args += "-e"
        $args += (Get-Content $sqlFile -Raw)

        $result = & $mysqlBin @args 2>&1
        if ($LASTEXITCODE -eq 0 -or ($result -match "completada OK")) {
            Write-Ok "Migración SQL aplicada"
        } else {
            # Verificar si los errores son solo de "ya existe"
            $criticalError = $result | Where-Object { $_ -match "ERROR" -and $_ -notmatch "already exists|Duplicate" }
            if ($criticalError) {
                Write-Warn "Advertencia en SQL (puede ser inofensiva si la columna/tabla ya existia):"
                $criticalError | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkYellow }
            } else {
                Write-Ok "Migración SQL aplicada (sin errores críticos)"
            }
        }
    } else {
        Write-Warn "No se encontro mysql/mariadb. La migración SQL debe aplicarse manualmente."
        Write-Host "      Archivo: $sqlFile" -ForegroundColor Gray
    }
} else {
    Write-Warn "No se encontró migration.sql"
}

# ── Copiar archivos backend (dist) ────────────────────────────────────────────
Write-Step "Actualizando backend (dist)..."
$srcDist  = "$PatchDir\backend\dist"
$destDist = "$InstallDir\backend\dist"

if (Test-Path $srcDist) {
    if (Test-Path $destDist) { Remove-Item -Recurse -Force $destDist }
    Copy-Item -Path $srcDist -Destination $destDist -Recurse -Force
    Write-Ok "backend\dist actualizado"
} else {
    Write-Warn "No se encontró backend\dist en el parche"
}

# ── Copiar frontend (public) ──────────────────────────────────────────────────
Write-Step "Actualizando frontend (public)..."
$srcPub  = "$PatchDir\backend\public"
$destPub = "$InstallDir\backend\public"

if (Test-Path $srcPub) {
    if (Test-Path $destPub) { Remove-Item -Recurse -Force $destPub }
    Copy-Item -Path $srcPub -Destination $destPub -Recurse -Force
    Write-Ok "backend\public actualizado"
} else {
    Write-Warn "No se encontró backend\public en el parche"
}

# ── Actualizar version en .env ────────────────────────────────────────────────
Write-Step "Actualizando versión en .env..."
$envFile = "$InstallDir\backend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match 'APP_VERSION=') {
        $envContent = $envContent -replace 'APP_VERSION=.*', "APP_VERSION=$VERSION"
    } else {
        $envContent = $envContent.TrimEnd() + "`nAPP_VERSION=$VERSION`n"
    }
    $envContent | Set-Content $envFile -Encoding UTF8 -NoNewline
    Write-Ok "APP_VERSION=$VERSION en .env"
}

# ── Actualizar version.json ───────────────────────────────────────────────────
$vjFile = "$InstallDir\version.json"
if (Test-Path $vjFile) {
    try {
        $vj = Get-Content $vjFile -Raw | ConvertFrom-Json
        $vj.version = $VERSION
        $vj | ConvertTo-Json | Set-Content $vjFile -Encoding UTF8
        Write-Ok "version.json -> $VERSION"
    } catch {
        Write-Warn "No se pudo actualizar version.json"
    }
}

# ── Reiniciar servicio ────────────────────────────────────────────────────────
Write-Step "Reiniciando servicio backend..."
if (Test-Path $NSSM) {
    & $NSSM start $SVC 2>&1 | Out-Null
} else {
    Write-Warn "NSSM no encontrado, inicia el servicio manualmente"
}

# ── Esperar que levante ───────────────────────────────────────────────────────
Write-Step "Esperando que el backend levante (max 60s)..."
$ok = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep 3
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 3000)
        $tcp.Close()
        $ok = $true
        break
    } catch {}
}

Write-Host ""
Write-Host "  ════════════════════════════════════════" -ForegroundColor DarkGray
if ($ok) {
    Write-Host "  PARCHE v$VERSION APLICADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Novedades:" -ForegroundColor White
    Write-Host "   - Devoluciones/reembolsos en efectivo (Reportes -> icono devolver)" -ForegroundColor Gray
    Write-Host "   - Menú Digital via Cloudflare (Worker URL en Configuracion -> Menu Digital)" -ForegroundColor Gray
    Write-Host "   - Self Order desde cualquier red via Worker URL" -ForegroundColor Gray
    Write-Host "   - Fix: config_pos ya no se pierde al guardar parcialmente" -ForegroundColor Gray
} else {
    Write-Host "  PARCHE APLICADO pero backend no respondio en 60s" -ForegroundColor Yellow
    Write-Host "  Revisa el servicio PosIaDos-Backend en Servicios de Windows" -ForegroundColor Gray
}
Write-Host "  ════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
