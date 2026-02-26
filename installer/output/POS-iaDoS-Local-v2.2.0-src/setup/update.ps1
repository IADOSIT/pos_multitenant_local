# =============================================================================
# POS-iaDoS - Aplicar Actualización
# Ejecutado desde un paquete de actualización (POS-iaDoS-UPDATE-vX.Y.Z/)
# =============================================================================
param(
    [string]$PatchPath = (Split-Path -Parent $PSScriptRoot),
    [string]$InstallDir = "C:\POS-iaDoS"
)

$ErrorActionPreference = "Stop"
$NSSM = "$InstallDir\tools\nssm.exe"

function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSeconds = 60)
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("127.0.0.1", $Port)
            $tcp.Close()
            return $true
        } catch {
            Start-Sleep -Seconds 2
            $elapsed += 2
        }
    }
    return $false
}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "   POS-iaDoS - Actualización" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar instalación existente
if (-not (Test-Path "$InstallDir\version.json")) {
    Write-Host "  ERROR: POS-iaDoS no esta instalado en $InstallDir" -ForegroundColor Red
    exit 1
}

$currentVersion = (Get-Content "$InstallDir\version.json" | ConvertFrom-Json).version
$patchInfo = Get-Content "$PatchPath\version.json" | ConvertFrom-Json
$newVersion = $patchInfo.version

Write-Host "  Version actual:  $currentVersion" -ForegroundColor White
Write-Host "  Nueva version:   $newVersion" -ForegroundColor White
Write-Host ""

if ($currentVersion -eq $newVersion) {
    Write-Host "  Ya tiene la version $newVersion instalada." -ForegroundColor Yellow
    exit 0
}

# --- Crear backup ---
Write-Host "  [1/4] Creando backup..." -ForegroundColor Yellow
$backupDir = "$InstallDir\backups\v$currentVersion-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# Backup del backend dist y public
if (Test-Path "$InstallDir\backend\dist") {
    Copy-Item -Path "$InstallDir\backend\dist" -Destination "$backupDir\dist" -Recurse -Force
}
if (Test-Path "$InstallDir\backend\public") {
    Copy-Item -Path "$InstallDir\backend\public" -Destination "$backupDir\public" -Recurse -Force
}
Copy-Item -Path "$InstallDir\version.json" -Destination "$backupDir\" -Force
Write-Host "  Backup en: $backupDir" -ForegroundColor Green

# --- Detener backend ---
Write-Host "  [2/4] Deteniendo backend..." -ForegroundColor Yellow
$ErrorActionPreference = "SilentlyContinue"
& $NSSM stop "PosIaDos-Backend" 2>&1 | Out-Null
$ErrorActionPreference = "Stop"
Start-Sleep -Seconds 3
Write-Host "  Backend detenido" -ForegroundColor Green

# --- Aplicar parche ---
Write-Host "  [3/4] Aplicando actualizacion..." -ForegroundColor Yellow

# Copiar archivos del parche (sobreescribe)
if (Test-Path "$PatchPath\app\backend\dist") {
    Write-Host "    Actualizando backend dist/..." -ForegroundColor Gray
    Copy-Item -Path "$PatchPath\app\backend\dist\*" -Destination "$InstallDir\backend\dist\" -Recurse -Force
}
if (Test-Path "$PatchPath\app\backend\public") {
    Write-Host "    Actualizando frontend..." -ForegroundColor Gray
    Copy-Item -Path "$PatchPath\app\backend\public\*" -Destination "$InstallDir\backend\public\" -Recurse -Force
}
if (Test-Path "$PatchPath\app\backend\node_modules") {
    Write-Host "    Actualizando dependencias..." -ForegroundColor Gray
    Copy-Item -Path "$PatchPath\app\backend\node_modules\*" -Destination "$InstallDir\backend\node_modules\" -Recurse -Force
}
if (Test-Path "$PatchPath\app\database") {
    Write-Host "    Actualizando SQL..." -ForegroundColor Gray
    Copy-Item -Path "$PatchPath\app\database\*" -Destination "$InstallDir\database\" -Recurse -Force
}

# Ejecutar migraciones SQL si existen
$migrationFile = "$PatchPath\app\database\migration-$newVersion.sql"
if (Test-Path $migrationFile) {
    Write-Host "    Ejecutando migracion SQL..." -ForegroundColor Gray
    $envFile = Get-Content "$InstallDir\backend\.env" | ConvertFrom-StringData
    $MYSQL = "$InstallDir\mariadb\bin\mysql.exe"
    $ErrorActionPreference = "SilentlyContinue"
    Get-Content $migrationFile -Raw | & $MYSQL -u $envFile.DB_USERNAME -p"$($envFile.DB_PASSWORD)" --host=127.0.0.1 --port=$($envFile.DB_PORT) $envFile.DB_DATABASE 2>&1
    $ErrorActionPreference = "Stop"
}

# Actualizar version.json
Copy-Item -Path "$PatchPath\version.json" -Destination "$InstallDir\version.json" -Force
Write-Host "  Archivos actualizados" -ForegroundColor Green

# --- Reiniciar backend ---
Write-Host "  [4/4] Reiniciando backend..." -ForegroundColor Yellow
$ErrorActionPreference = "SilentlyContinue"
& $NSSM start "PosIaDos-Backend" 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

if (Wait-ForPort -Port 3000 -TimeoutSeconds 30) {
    Write-Host "  Backend reiniciado" -ForegroundColor Green
} else {
    Write-Host "  ADVERTENCIA: Backend tardo en iniciar. Revise logs." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   Actualizado a v$newVersion" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  URL: http://localhost:3000" -ForegroundColor White
Write-Host ""
