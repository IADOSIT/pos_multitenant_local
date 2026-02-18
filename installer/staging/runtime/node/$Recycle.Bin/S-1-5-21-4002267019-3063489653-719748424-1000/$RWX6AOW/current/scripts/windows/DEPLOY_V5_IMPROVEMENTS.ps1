# EMC Abastos - V5 Improvements Deployment Script
# Run from project root: .\scripts\windows\DEPLOY_V5_IMPROVEMENTS.ps1

$ErrorActionPreference = "Stop"
$projectRoot = "C:\sites\emc_abastos\current"
$php = "C:\php\php.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EMC Abastos - V5 Improvements" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $projectRoot

# Step 1: Run V5 Migration
Write-Host "[1/5] Running V5 migration..." -ForegroundColor Yellow
& $php artisan migrate
Write-Host "Migration complete!" -ForegroundColor Green

# Step 2: Clear caches
Write-Host "[2/5] Clearing caches..." -ForegroundColor Yellow
& $php artisan cache:clear
& $php artisan config:clear
& $php artisan route:clear
& $php artisan view:clear
Write-Host "Caches cleared!" -ForegroundColor Green

# Step 3: Build Portal React App
Write-Host "[3/5] Building Portal React App..." -ForegroundColor Yellow
Set-Location "$projectRoot\portal"
npm install
npm run build
Set-Location $projectRoot
Write-Host "Portal built!" -ForegroundColor Green

# Step 4: Deploy portal
Write-Host "[4/5] Deploying portal to public/portal..." -ForegroundColor Yellow
$portalDest = "$projectRoot\public\portal"
if (Test-Path "$portalDest\assets") {
    Remove-Item -Recurse -Force "$portalDest\assets"
}
Copy-Item -Recurse "$projectRoot\portal\dist\*" $portalDest -Force
Write-Host "Portal deployed!" -ForegroundColor Green

# Step 5: Create storage link if not exists
Write-Host "[5/5] Ensuring storage link..." -ForegroundColor Yellow
if (-not (Test-Path "$projectRoot\public\storage")) {
    & $php artisan storage:link
}
Write-Host "Storage link OK!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  V5 Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "V5 Features Deployed:" -ForegroundColor White
Write-Host "  - ProductImageService (auto/manual/default images)" -ForegroundColor Gray
Write-Host "  - Dashboard Alerts (inventory, orders, payments)" -ForegroundColor Gray
Write-Host "  - Multi-empresa Registration" -ForegroundColor Gray
Write-Host "  - Portal: Products page" -ForegroundColor Gray
Write-Host "  - Portal: Promos page" -ForegroundColor Gray
Write-Host "  - Portal: AI Assistant (placeholder)" -ForegroundColor Gray
Write-Host "  - Portal: Professional menu with icons" -ForegroundColor Gray
Write-Host "  - Admin: Product image upload" -ForegroundColor Gray
Write-Host ""
