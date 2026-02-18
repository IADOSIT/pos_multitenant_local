# EMC Abastos - Reset Database and Seed Demo Data
# Run from project root: .\scripts\windows\RESET_DEMO.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
Set-Location -LiteralPath $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EMC Abastos - Reset completo de base de datos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$PhpPath = "C:\php\php.exe"
if (-not (Test-Path -LiteralPath $PhpPath)) {
    Write-Host "ERROR: PHP no encontrado en $PhpPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "ADVERTENCIA: Esto eliminara TODOS los datos!" -ForegroundColor Red
$confirm = Read-Host "Escriba 'SI' para continuar"
if ($confirm -ne "SI") {
    Write-Host "Operacion cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/4] Reseteando base de datos..." -ForegroundColor Yellow
& $PhpPath artisan migrate:fresh --force

Write-Host "[2/4] Ejecutando seeders..." -ForegroundColor Yellow
& $PhpPath artisan db:seed --force

Write-Host "[3/4] Creando storage link..." -ForegroundColor Yellow
if (-not (Test-Path -LiteralPath "public\storage")) {
    & $PhpPath artisan storage:link
}

Write-Host "[4/4] Limpiando cache..." -ForegroundColor Yellow
& $PhpPath artisan optimize:clear

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Base de datos reseteada exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Usuarios de prueba:" -ForegroundColor Cyan
Write-Host "  Superadmin: admin@emc.test / password" -ForegroundColor White
Write-Host "  Admin MTY:  admin@abastosmty.test / password" -ForegroundColor White
Write-Host ""
