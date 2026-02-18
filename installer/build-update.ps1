# =============================================================================
# POS-iaDoS - Generador de Paquetes de Actualización
# Ejecutar desde: installer/
# Uso: .\build-update.ps1 -NewVersion "1.0.1"
# Genera: installer/output/POS-iaDoS-UPDATE-v{VERSION}/
# =============================================================================
param(
    [Parameter(Mandatory=$true)]
    [string]$NewVersion,
    [string]$MigrationSQL = "",
    [switch]$CreateZip
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot
$INSTALLER_DIR = $PSScriptRoot
$OUTPUT = "$INSTALLER_DIR\output\POS-iaDoS-UPDATE-v$NewVersion"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " POS-iaDoS - Build Update v$NewVersion" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Limpiar output previo
if (Test-Path $OUTPUT) { Remove-Item -Recurse -Force $OUTPUT }
New-Item -ItemType Directory -Force -Path $OUTPUT | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT\app\backend" | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT\app\database" | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT\setup" | Out-Null

# =============================================================================
# PASO 1: Compilar Backend
# =============================================================================
Write-Host "[1/4] Compilando backend..." -ForegroundColor Yellow

Push-Location "$ROOT\backend"
& npm install --silent 2>&1 | Out-Null
& npm run build 2>&1 | Out-Null

if (-not (Test-Path "dist\main.js")) {
    Write-Host "  ERROR: No se genero dist/main.js" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Copiar dist compilado
Copy-Item -Path "dist" -Destination "$OUTPUT\app\backend\dist" -Recurse -Force

# Copiar package.json para verificar dependencias
Copy-Item -Path "package.json" -Destination "$OUTPUT\app\backend\" -Force
Copy-Item -Path "package-lock.json" -Destination "$OUTPUT\app\backend\" -Force

# Instalar dependencias de produccion
Push-Location "$OUTPUT\app\backend"
& npm install --production --silent 2>&1 | Out-Null
Pop-Location

Pop-Location
Write-Host "  Backend compilado" -ForegroundColor Green

# =============================================================================
# PASO 2: Compilar Frontend
# =============================================================================
Write-Host "[2/4] Compilando frontend..." -ForegroundColor Yellow

Push-Location "$ROOT\frontend"
& npm install --silent 2>&1 | Out-Null
$env:VITE_API_URL = "/api"
& npm run build 2>&1 | Out-Null

if (-not (Test-Path "dist\index.html")) {
    Write-Host "  ERROR: No se genero dist/index.html" -ForegroundColor Red
    Pop-Location
    exit 1
}

New-Item -ItemType Directory -Force -Path "$OUTPUT\app\backend\public" | Out-Null
Copy-Item -Path "dist\*" -Destination "$OUTPUT\app\backend\public" -Recurse -Force

Pop-Location
Write-Host "  Frontend compilado" -ForegroundColor Green

# =============================================================================
# PASO 3: Copiar archivos de soporte
# =============================================================================
Write-Host "[3/4] Preparando paquete de actualizacion..." -ForegroundColor Yellow

# Migration SQL si se proporciona
if ($MigrationSQL -and (Test-Path $MigrationSQL)) {
    Copy-Item -Path $MigrationSQL -Destination "$OUTPUT\app\database\migration-$NewVersion.sql" -Force
    Write-Host "  Migracion SQL incluida" -ForegroundColor Gray
}

# Scripts
Copy-Item -Path "$INSTALLER_DIR\scripts\update.ps1" -Destination "$OUTPUT\setup\" -Force
Copy-Item -Path "$INSTALLER_DIR\scripts\services.ps1" -Destination "$OUTPUT\setup\" -Force

# ACTUALIZAR.bat
@"
@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Actualizacion a v$NewVersion
echo.
echo  Actualizando POS-iaDoS a v$NewVersion...
echo.
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
powershell -ExecutionPolicy Bypass -File "%~dp0setup\update.ps1" -PatchPath "%~dp0"
echo.
pause
"@ | Set-Content "$OUTPUT\ACTUALIZAR.bat"

# Version
$versionData = @{
    version = $NewVersion
    build_date = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    product = "POS-iaDoS"
    company = "iaDoS"
    type = "update"
}
$versionData | ConvertTo-Json | Set-Content "$OUTPUT\version.json"

Write-Host "  Paquete preparado" -ForegroundColor Green

# =============================================================================
# PASO 4: ZIP (opcional)
# =============================================================================
if ($CreateZip) {
    Write-Host "[4/4] Creando ZIP..." -ForegroundColor Yellow
    $zipPath = "$INSTALLER_DIR\output\POS-iaDoS-UPDATE-v$NewVersion.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path $OUTPUT -DestinationPath $zipPath -CompressionLevel Optimal
    $sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
    Write-Host "  ZIP: $zipPath ($sizeMB MB)" -ForegroundColor Green
} else {
    Write-Host "[4/4] ZIP no solicitado (usar -CreateZip)" -ForegroundColor DarkGray
}

# =============================================================================
# Actualizar version.json del installer para proxima vez
# =============================================================================
$installerVersion = Get-Content "$INSTALLER_DIR\version.json" | ConvertFrom-Json
$installerVersion.version = $NewVersion
$installerVersion | ConvertTo-Json | Set-Content "$INSTALLER_DIR\version.json"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " Update v$NewVersion generado!" -ForegroundColor Green
Write-Host " Output: $OUTPUT" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Instrucciones:" -ForegroundColor White
Write-Host "  1. Copiar carpeta POS-iaDoS-UPDATE-v$NewVersion al equipo destino" -ForegroundColor Gray
Write-Host "  2. Ejecutar ACTUALIZAR.bat como administrador" -ForegroundColor Gray
Write-Host ""
