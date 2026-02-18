# EMC Abastos - Install Livewire + Mary UI + Tailwind
# Run from project root: .\scripts\windows\INSTALL_LIVEWIRE_MARY.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
Set-Location -LiteralPath $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EMC Abastos - Instalacion de dependencias" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check PHP
$PhpPath = "C:\php\php.exe"
if (-not (Test-Path -LiteralPath $PhpPath)) {
    Write-Host "ERROR: PHP no encontrado en $PhpPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[1/5] Verificando Composer..." -ForegroundColor Yellow

# Install composer dependencies
Write-Host "[2/5] Instalando dependencias de Composer..." -ForegroundColor Yellow
& $PhpPath -d memory_limit=-1 (Get-Command composer).Source install --no-interaction

# Verify Livewire is installed
$ComposerJson = Get-Content -LiteralPath "composer.json" -Raw | ConvertFrom-Json
if (-not $ComposerJson.require.'livewire/livewire') {
    Write-Host "Instalando Livewire 3..." -ForegroundColor Yellow
    & $PhpPath -d memory_limit=-1 (Get-Command composer).Source require livewire/livewire
}

Write-Host "[3/5] Instalando dependencias de NPM..." -ForegroundColor Yellow
npm install

Write-Host "[4/5] Compilando assets con Vite..." -ForegroundColor Yellow
npm run build

Write-Host "[5/5] Limpiando cache de Laravel..." -ForegroundColor Yellow
& $PhpPath artisan config:clear
& $PhpPath artisan cache:clear
& $PhpPath artisan view:clear
& $PhpPath artisan route:clear

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Instalacion completada exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: ejecutar SEED_DEMO.ps1 para cargar datos demo" -ForegroundColor Cyan
