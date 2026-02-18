# EMC Abastos - V4 Portal Deployment Script
# Run from project root: .\scripts\windows\DEPLOY_V4_PORTAL.ps1

param(
    [switch]$Fresh,
    [switch]$SkipMigration
)

$ErrorActionPreference = "Stop"
$projectRoot = "C:\sites\emc_abastos\current"
$php = "C:\php\php.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EMC Abastos - V4 Portal Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $projectRoot

# Step 1: Run V4 Migration
if (-not $SkipMigration) {
    Write-Host "[1/5] Running V4 migration..." -ForegroundColor Yellow
    if ($Fresh) {
        & $php artisan migrate:fresh --seed
    } else {
        & $php artisan migrate
    }
    Write-Host "Migration complete!" -ForegroundColor Green
} else {
    Write-Host "[1/5] Skipping migration..." -ForegroundColor Gray
}

# Step 2: Seed V4 Portal Data
Write-Host "[2/5] Seeding V4 portal data..." -ForegroundColor Yellow
& $php artisan db:seed --class=V4PortalSeeder
Write-Host "Portal data seeded!" -ForegroundColor Green

# Step 3: Build Portal React App
Write-Host "[3/5] Building Portal React App..." -ForegroundColor Yellow
Set-Location "$projectRoot\portal"
npm install
npm run build
Set-Location $projectRoot
Write-Host "Portal built!" -ForegroundColor Green

# Step 4: Copy portal dist to public
Write-Host "[4/5] Deploying portal to public/portal..." -ForegroundColor Yellow
$portalDest = "$projectRoot\public\portal"
if (Test-Path $portalDest) {
    Remove-Item -Recurse -Force $portalDest
}
Copy-Item -Recurse "$projectRoot\portal\dist" $portalDest
Write-Host "Portal deployed!" -ForegroundColor Green

# Step 5: Clear caches
Write-Host "[5/5] Clearing Laravel caches..." -ForegroundColor Yellow
& $php artisan cache:clear
& $php artisan config:clear
& $php artisan route:clear
& $php artisan view:clear
Write-Host "Caches cleared!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  V4 Portal Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Portal URL: /portal/" -ForegroundColor White
Write-Host "API Base: /api/public/" -ForegroundColor White
Write-Host ""
Write-Host "Test endpoints:" -ForegroundColor Gray
Write-Host "  GET /api/public/portal-config" -ForegroundColor Gray
Write-Host "  GET /api/public/stores" -ForegroundColor Gray
Write-Host "  GET /api/public/promotions" -ForegroundColor Gray
Write-Host ""
