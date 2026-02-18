# ============================================
# EMC Abastos - Deploy V10 Premium Storefront
# ============================================
# This script deploys the V10 premium storefront redesign
# No database changes - UI/CSS/Blade only
#
# Changes:
# - New premium storefront layout (layouts/storefront.blade.php)
# - Blade components: navbar, footer, product-card, banner, hero-slider
# - Full-width responsive design with modern typography (Inter + Manrope)
# - CSS variables for brand theming
# - Fixed product image handling (uses display_image attribute)
# - Mobile-first design with large touch targets
#
# Author: Claude Code
# Date: 2026-02-07
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " EMC Abastos - Deploy V10 Premium Storefront" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\sites\emc_abastos\current"
$phpPath = "C:\php\php.exe"

# Verify paths
if (-not (Test-Path $projectPath)) {
    Write-Host "ERROR: Project path not found: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath

Write-Host "1. Clearing view cache..." -ForegroundColor Yellow
& $phpPath artisan view:clear
Write-Host "   View cache cleared" -ForegroundColor Green

Write-Host ""
Write-Host "2. Verifying new files exist..." -ForegroundColor Yellow

$requiredFiles = @(
    "resources\views\layouts\storefront.blade.php",
    "resources\views\components\storefront\navbar.blade.php",
    "resources\views\components\storefront\footer.blade.php",
    "resources\views\components\storefront\product-card.blade.php",
    "resources\views\components\storefront\banner.blade.php",
    "resources\views\components\storefront\hero-slider.blade.php"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $projectPath $file
    if (Test-Path $fullPath) {
        Write-Host "   [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "   [MISSING] $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "ERROR: Some required files are missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Verifying store views updated..." -ForegroundColor Yellow

$storeViews = @(
    "resources\views\store\index.blade.php",
    "resources\views\store\producto.blade.php",
    "resources\views\store\cart.blade.php",
    "resources\views\store\checkout.blade.php",
    "resources\views\store\thanks.blade.php",
    "resources\views\store\track.blade.php"
)

foreach ($view in $storeViews) {
    $fullPath = Join-Path $projectPath $view
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        if ($content -match "layouts\.storefront") {
            Write-Host "   [OK] $view -> uses storefront layout" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] $view -> still uses old layout" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "4. Verifying placeholder image..." -ForegroundColor Yellow
$placeholderPath = Join-Path $projectPath "public\images\producto-default.svg"
if (Test-Path $placeholderPath) {
    Write-Host "   [OK] producto-default.svg exists" -ForegroundColor Green
} else {
    Write-Host "   [WARN] producto-default.svg not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "5. Verifying storage link..." -ForegroundColor Yellow
$storageLinkPath = Join-Path $projectPath "public\storage"
if (Test-Path $storageLinkPath) {
    Write-Host "   [OK] Storage link exists" -ForegroundColor Green
} else {
    Write-Host "   Creating storage link..." -ForegroundColor Yellow
    & $phpPath artisan storage:link
    Write-Host "   Storage link created" -ForegroundColor Green
}

Write-Host ""
Write-Host "6. Clearing all caches..." -ForegroundColor Yellow
& $phpPath artisan cache:clear
& $phpPath artisan config:clear
& $phpPath artisan route:clear
Write-Host "   All caches cleared" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " V10 Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes deployed:" -ForegroundColor White
Write-Host "  - New premium storefront layout with full-width design" -ForegroundColor Gray
Write-Host "  - Modern typography (Inter + Manrope fonts)" -ForegroundColor Gray
Write-Host "  - Blade components: navbar, footer, product-card, banner" -ForegroundColor Gray
Write-Host "  - CSS variables for brand theming" -ForegroundColor Gray
Write-Host "  - Fixed product image handling" -ForegroundColor Gray
Write-Host "  - Mobile-first responsive design" -ForegroundColor Gray
Write-Host ""
Write-Host "Test URLs:" -ForegroundColor White
Write-Host "  - Store home: /store" -ForegroundColor Gray
Write-Host "  - Product: /store/producto/{id}" -ForegroundColor Gray
Write-Host "  - Cart: /cart" -ForegroundColor Gray
Write-Host "  - Checkout: /checkout" -ForegroundColor Gray
Write-Host ""
