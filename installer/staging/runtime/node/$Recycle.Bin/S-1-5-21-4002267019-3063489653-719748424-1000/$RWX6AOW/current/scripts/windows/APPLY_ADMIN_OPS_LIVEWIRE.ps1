# EMC Abastos - Apply Admin/Ops Livewire Components
# Run from project root: .\scripts\windows\APPLY_ADMIN_OPS_LIVEWIRE.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
Set-Location -LiteralPath $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EMC Abastos - Aplicando componentes Livewire" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$PhpPath = "C:\php\php.exe"
if (-not (Test-Path -LiteralPath $PhpPath)) {
    Write-Host "ERROR: PHP no encontrado en $PhpPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[1/5] Verificando estructura de directorios..." -ForegroundColor Yellow

$dirs = @(
    "app\Livewire\Admin",
    "app\Livewire\Ops",
    "resources\views\livewire\admin",
    "resources\views\livewire\ops",
    "resources\views\components\layouts"
)

foreach ($dir in $dirs) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (-not (Test-Path -LiteralPath $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "  Creado: $dir" -ForegroundColor Gray
    } else {
        Write-Host "  Existe: $dir" -ForegroundColor Gray
    }
}

Write-Host "[2/5] Compilando assets..." -ForegroundColor Yellow
npm run build

Write-Host "[3/5] Limpiando cache de vistas..." -ForegroundColor Yellow
& $PhpPath artisan view:clear

Write-Host "[4/5] Verificando rutas..." -ForegroundColor Yellow
& $PhpPath artisan route:list --name=admin --columns=method,uri,name 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Advertencia: Error al listar rutas" -ForegroundColor Yellow
}

Write-Host "[5/5] Limpiando cache general..." -ForegroundColor Yellow
& $PhpPath artisan optimize:clear

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Componentes Livewire aplicados!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Componentes disponibles:" -ForegroundColor Cyan
Write-Host "  - Admin Dashboard: /admin" -ForegroundColor White
Write-Host "  - Empresas: /admin/empresas (superadmin)" -ForegroundColor White
Write-Host "  - Categorias: /admin/categorias" -ForegroundColor White
Write-Host "  - Productos: /admin/productos" -ForegroundColor White
Write-Host "  - Usuarios: /admin/usuarios" -ForegroundColor White
Write-Host "  - Ordenes: /ops/ordenes" -ForegroundColor White
Write-Host ""
