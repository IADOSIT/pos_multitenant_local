param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [string]$PatchDir   = $PSScriptRoot
)

$VERSION = "2.2.72"
$NSSM    = "$InstallDir\tools\nssm.exe"
$SVC     = "PosIaDos-Backend"

function Write-Step($msg) { Write-Host "  >> $msg" -ForegroundColor Yellow }
function Write-Ok($msg)   { Write-Host "     OK: $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "     AVISO: $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "     ERROR: $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  POS-iaDoS Parche v$VERSION" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path $InstallDir)) {
    Write-Fail "No se encontro la instalacion en: $InstallDir"
}

# ── 1. Matar proceso node.exe primero (evita archivos bloqueados) ─────────────
Write-Step "Deteniendo procesos node.exe..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2

# ── 2. Detener servicio NSSM ──────────────────────────────────────────────────
Write-Step "Deteniendo servicio $SVC..."
if (Test-Path $NSSM) {
    & $NSSM stop $SVC 2>&1 | Out-Null
} else {
    & sc.exe stop $SVC 2>&1 | Out-Null
}
Start-Sleep 4

# Matar node de nuevo por si NSSM lo revivio
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
Write-Ok "Procesos detenidos"

# ── 3. Migración SQL ──────────────────────────────────────────────────────────
Write-Step "Aplicando migracion SQL..."
$sqlFile = "$PatchDir\migration.sql"
if (Test-Path $sqlFile) {
    $envFile = "$InstallDir\backend\.env"
    $dbName = "pos_iados"; $dbUser = "root"; $dbPass = ""; $dbPort = "3306"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^DB_DATABASE=(.+)')  { $dbName = $matches[1].Trim() }
            if ($_ -match '^DB_USERNAME=(.+)')  { $dbUser = $matches[1].Trim() }
            if ($_ -match '^DB_PASSWORD=(.+)')  { $dbPass = $matches[1].Trim() }
            if ($_ -match '^DB_PORT=(.+)')      { $dbPort = $matches[1].Trim() }
        }
    }
    $mysqlBin = $null
    @("$InstallDir\mariadb\bin\mysql.exe","$InstallDir\mysql\bin\mysql.exe",
      "C:\Program Files\MariaDB 10.6\bin\mysql.exe") | ForEach-Object {
        if ((Test-Path $_) -and -not $mysqlBin) { $mysqlBin = $_ }
    }
    if (-not $mysqlBin) {
        $cmd = Get-Command mysql -ErrorAction SilentlyContinue
        if ($cmd) { $mysqlBin = $cmd.Source }
    }
    if ($mysqlBin) {
        $args2 = @("-u",$dbUser,"-P",$dbPort,"--protocol=TCP","-f")
        if ($dbPass) { $args2 += "-p$dbPass" }
        $args2 += $dbName
        Get-Content $sqlFile -Raw | & $mysqlBin @args2 2>&1 | Out-Null
        Write-Ok "Migracion aplicada"
    } else {
        Write-Warn "mysql.exe no encontrado — aplica $sqlFile manualmente"
    }
}

# ── 4. Backup del dist actual ─────────────────────────────────────────────────
Write-Step "Haciendo backup del dist actual..."
$backupDir = "$InstallDir\_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
if (Test-Path "$InstallDir\backend\dist") {
    Copy-Item "$InstallDir\backend\dist" "$backupDir\dist" -Recurse -Force
}
if (Test-Path "$InstallDir\backend\public") {
    Copy-Item "$InstallDir\backend\public" "$backupDir\public" -Recurse -Force
}
Write-Ok "Backup en $backupDir"

# ── 5. Copiar backend dist ────────────────────────────────────────────────────
Write-Step "Copiando backend\dist..."
$srcDist = "$PatchDir\backend\dist"
$dstDist = "$InstallDir\backend\dist"
if (-not (Test-Path $srcDist)) { Write-Fail "No existe $srcDist en el parche" }

if (Test-Path $dstDist) { Remove-Item $dstDist -Recurse -Force -ErrorAction Stop }
Copy-Item $srcDist $dstDist -Recurse -Force -ErrorAction Stop
$count = (Get-ChildItem $dstDist -Recurse -File).Count
Write-Ok "$count archivos copiados a backend\dist"

# ── 6. Copiar frontend public ─────────────────────────────────────────────────
Write-Step "Copiando backend\public..."
$srcPub = "$PatchDir\backend\public"
$dstPub = "$InstallDir\backend\public"
if (-not (Test-Path $srcPub)) { Write-Fail "No existe $srcPub en el parche" }

if (Test-Path $dstPub) { Remove-Item $dstPub -Recurse -Force -ErrorAction Stop }
Copy-Item $srcPub $dstPub -Recurse -Force -ErrorAction Stop
$count2 = (Get-ChildItem $dstPub -Recurse -File).Count
Write-Ok "$count2 archivos copiados a backend\public"

# ── 7. Actualizar .env y version.json ────────────────────────────────────────
Write-Step "Actualizando version..."
$envF = "$InstallDir\backend\.env"
if (Test-Path $envF) {
    $ec = Get-Content $envF -Raw
    $ec = if ($ec -match 'APP_VERSION=') { $ec -replace 'APP_VERSION=\S*',"APP_VERSION=$VERSION" } `
          else { $ec.TrimEnd() + "`nAPP_VERSION=$VERSION`n" }
    $ec | Set-Content $envF -Encoding UTF8 -NoNewline
}
$vjF = "$InstallDir\version.json"
if (Test-Path $vjF) {
    try { $vj = Get-Content $vjF -Raw | ConvertFrom-Json; $vj.version = $VERSION
          $vj | ConvertTo-Json | Set-Content $vjF -Encoding UTF8 } catch {}
}
Write-Ok "v$VERSION"

# ── 8. Iniciar servicio ───────────────────────────────────────────────────────
Write-Step "Iniciando servicio..."
if (Test-Path $NSSM) {
    & $NSSM start $SVC 2>&1 | Out-Null
} else {
    & sc.exe start $SVC 2>&1 | Out-Null
}

# ── 9. Esperar backend ────────────────────────────────────────────────────────
Write-Step "Esperando backend (max 90s)..."
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep 3
    try { $t = New-Object System.Net.Sockets.TcpClient; $t.Connect("127.0.0.1",3000); $t.Close(); $ok=$true; break } catch {}
}

Write-Host ""
Write-Host "  ========================================" -ForegroundColor DarkGray
if ($ok) {
    Write-Host "  PARCHE v$VERSION APLICADO OK" -ForegroundColor Green
    Write-Host "  Abre http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "  Archivos copiados pero backend no respondio." -ForegroundColor Yellow
    Write-Host "  Revisa: $InstallDir\logs\backend-stderr.log" -ForegroundColor Gray
    Write-Host "  Backup disponible en: $backupDir" -ForegroundColor Gray
}
Write-Host "  ========================================" -ForegroundColor DarkGray
Write-Host ""
