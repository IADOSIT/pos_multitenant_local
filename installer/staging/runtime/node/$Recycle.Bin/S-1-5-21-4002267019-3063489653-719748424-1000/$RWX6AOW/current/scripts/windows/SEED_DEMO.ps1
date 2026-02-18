# EMC Abastos - Seed Demo Data (V3)
# Run from project root: .\scripts\windows\SEED_DEMO.ps1
# Or: powershell -ExecutionPolicy Bypass -File .\scripts\windows\SEED_DEMO.ps1

param(
    [switch]$Fresh = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
Set-Location -LiteralPath $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EMC Abastos - Cargando datos demo V3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$PhpPath = "C:\php\php.exe"
if (-not (Test-Path -LiteralPath $PhpPath)) {
    Write-Host "WARNING: PHP not found at $PhpPath, using PATH" -ForegroundColor Yellow
    $PhpPath = "php"
}

Write-Host ""

if ($Fresh) {
    Write-Host "[1/5] Fresh migration (dropping all tables)..." -ForegroundColor Yellow
    & $PhpPath artisan migrate:fresh --force
} else {
    Write-Host "[1/5] Ejecutando migraciones..." -ForegroundColor Yellow
    & $PhpPath artisan migrate --force
}

Write-Host "[2/5] Ejecutando DatabaseSeeder..." -ForegroundColor Yellow
& $PhpPath artisan db:seed --force

Write-Host "[3/5] Ejecutando V3DemoSeeder..." -ForegroundColor Yellow
& $PhpPath artisan db:seed --class=V3DemoSeeder --force

Write-Host "[4/5] Creando storage link..." -ForegroundColor Yellow
if (-not (Test-Path -LiteralPath "public\storage")) {
    & $PhpPath artisan storage:link
} else {
    Write-Host "  Storage link ya existe" -ForegroundColor Gray
}

Write-Host "[5/5] Limpiando cache..." -ForegroundColor Yellow
& $PhpPath artisan optimize:clear

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Datos demo V3 cargados exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Empresas creadas:" -ForegroundColor Cyan
Write-Host "  1. Mercado De Abastos - Guadalupe (slug: abastos-guadalupe)" -ForegroundColor White
Write-Host "  2. Mercado De Abastos - San Nicolas (slug: abastos-sannicolas)" -ForegroundColor White
Write-Host ""
Write-Host "Usuarios de prueba (password: password):" -ForegroundColor Cyan
Write-Host "  Superadmin:     admin@iados.mx" -ForegroundColor White
Write-Host "  Admin Guadalupe: admin.guadalupe@demo.com" -ForegroundColor White
Write-Host "  Operador:       operador@demo.com" -ForegroundColor White
Write-Host ""
Write-Host "Temas disponibles:" -ForegroundColor Cyan
Write-Host "  - Abastos Verde (default)" -ForegroundColor White
Write-Host "  - Minimal Azul" -ForegroundColor White
Write-Host "  - Corporate Oscuro" -ForegroundColor White
Write-Host ""
Write-Host "Datos demo incluidos:" -ForegroundColor Cyan
Write-Host "  - 8 productos por empresa (sin imagenes, auto-fetch activo)" -ForegroundColor White
Write-Host "  - 3 clientes por empresa" -ForegroundColor White
Write-Host "  - 3 ordenes por empresa (paid, pending, failed)" -ForegroundColor White
Write-Host ""
Write-Host "Iniciar servidor: php artisan serve" -ForegroundColor Cyan
Write-Host ""
