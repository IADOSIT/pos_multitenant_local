# EMC Abastos - Apply V3 Operational Upgrades
# Run from project root: .\scripts\windows\APPLY_OPERATIONAL_UPGRADES.ps1
# Or: powershell -ExecutionPolicy Bypass -File .\scripts\windows\APPLY_OPERATIONAL_UPGRADES.ps1

param(
    [string]$Root = "C:\sites\emc_abastos\current",
    [string]$AppPool = "emc_abastos"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $Root

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "EMC Abastos - V3 Operational Upgrades" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$PhpPath = "C:\php\php.exe"
if (-not (Test-Path -LiteralPath $PhpPath)) {
    Write-Host "WARNING: PHP not found at $PhpPath, using PATH" -ForegroundColor Yellow
    $PhpPath = "php"
}

# Step 1: Ensure directories exist
Write-Host "[1/8] Creating required directories..." -ForegroundColor Yellow
$dirs = @(
    "bootstrap\cache",
    "storage\app\public",
    "storage\app\productos",
    "storage\framework\cache\data",
    "storage\framework\sessions",
    "storage\framework\views",
    "storage\logs"
)
foreach ($d in $dirs) {
    $fullPath = Join-Path $Root $d
    if (-not (Test-Path -LiteralPath $fullPath)) {
        New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
        Write-Host "  Created: $d" -ForegroundColor Gray
    }
}

# Step 2: Set permissions
Write-Host "[2/8] Setting permissions..." -ForegroundColor Yellow
$permPaths = @(
    (Join-Path $Root "bootstrap\cache"),
    (Join-Path $Root "storage")
)
foreach ($p in $permPaths) {
    cmd /c "icacls `"$p`" /inheritance:e" 2>&1 | Out-Null
    cmd /c "icacls `"$p`" /grant Users:(OI)(CI)M /T" 2>&1 | Out-Null
    if ($AppPool) {
        cmd /c "icacls `"$p`" /grant `"IIS AppPool\$AppPool`":(OI)(CI)M /T" 2>&1 | Out-Null
    }
}
Write-Host "  Permissions set for storage and bootstrap/cache" -ForegroundColor Gray

# Step 3: Clear bootstrap caches
Write-Host "[3/8] Clearing bootstrap caches..." -ForegroundColor Yellow
Remove-Item -Force ".\bootstrap\cache\config.php" -ErrorAction SilentlyContinue
Remove-Item -Force ".\bootstrap\cache\services.php" -ErrorAction SilentlyContinue
Remove-Item -Force ".\bootstrap\cache\packages.php" -ErrorAction SilentlyContinue
Remove-Item -Force ".\bootstrap\cache\routes-v7.php" -ErrorAction SilentlyContinue

# Step 4: Composer autoload
Write-Host "[4/8] Regenerating Composer autoload..." -ForegroundColor Yellow
& composer dump-autoload -o 2>&1 | Out-Null

# Step 5: Artisan clear
Write-Host "[5/8] Clearing Laravel caches..." -ForegroundColor Yellow
& $PhpPath artisan optimize:clear 2>&1 | Out-Null

# Step 6: Run migrations
Write-Host "[6/8] Running V3 migrations..." -ForegroundColor Yellow
& $PhpPath artisan migrate --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Migration failed!" -ForegroundColor Red
    exit 1
}

# Step 7: Create storage link
Write-Host "[7/8] Creating storage link..." -ForegroundColor Yellow
if (-not (Test-Path -LiteralPath "public\storage")) {
    & $PhpPath artisan storage:link 2>&1 | Out-Null
    Write-Host "  Storage link created" -ForegroundColor Gray
} else {
    Write-Host "  Storage link already exists" -ForegroundColor Gray
}

# Step 8: Optimize
Write-Host "[8/8] Optimizing application..." -ForegroundColor Yellow
& $PhpPath artisan config:cache 2>&1 | Out-Null
& $PhpPath artisan route:cache 2>&1 | Out-Null
& $PhpPath artisan view:cache 2>&1 | Out-Null

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "V3 Operational Upgrades Applied Successfully!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "New features available:" -ForegroundColor Cyan
Write-Host "  - Superadmin CRUDs (Empresas, Usuarios, Temas)" -ForegroundColor White
Write-Host "  - AJAX Cart (add without redirect)" -ForegroundColor White
Write-Host "  - MercadoPago Checkout Pro integration" -ForegroundColor White
Write-Host "  - AI Help Assistant (admin/ayuda)" -ForegroundColor White
Write-Host "  - User registration with rate limiting" -ForegroundColor White
Write-Host "  - Clientes CRUD with order history" -ForegroundColor White
Write-Host "  - Payment management dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run SEED_DEMO.ps1 to load demo data" -ForegroundColor White
Write-Host "  2. Configure MercadoPago in Admin > Empresas" -ForegroundColor White
Write-Host "  3. Set OPENAI_API_KEY in .env for AI assistant" -ForegroundColor White
Write-Host ""
