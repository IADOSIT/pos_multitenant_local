# ============================================================
# EMC Abastos V11 Deployment Script
# Pickup/Delivery Toggle + Themes V2 + React/Astro Structure
# ============================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " EMC Abastos V11 - Fulfillment & Themes Deploy" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$phpPath = "C:\php\php.exe"
$artisanPath = "C:\sites\emc_abastos\current\artisan"

# Check PHP exists
if (-not (Test-Path $phpPath)) {
    Write-Host "ERROR: PHP not found at $phpPath" -ForegroundColor Red
    exit 1
}

# Step 1: Run migrations
Write-Host "[1/5] Running migrations..." -ForegroundColor Yellow
& $phpPath $artisanPath migrate --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Migrations completed." -ForegroundColor Green
Write-Host ""

# Step 2: Run Themes V2 seeder
Write-Host "[2/5] Seeding Themes V2..." -ForegroundColor Yellow
& $phpPath $artisanPath db:seed --class=ThemesV2Seeder --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "Seeder failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Themes V2 seeded successfully." -ForegroundColor Green
Write-Host ""

# Step 3: Clear caches
Write-Host "[3/5] Clearing caches..." -ForegroundColor Yellow
& $phpPath $artisanPath cache:clear
& $phpPath $artisanPath config:clear
& $phpPath $artisanPath view:clear
& $phpPath $artisanPath route:clear
Write-Host "Caches cleared." -ForegroundColor Green
Write-Host ""

# Step 4: Optimize for production
Write-Host "[4/5] Optimizing for production..." -ForegroundColor Yellow
& $phpPath $artisanPath config:cache
& $phpPath $artisanPath route:cache
& $phpPath $artisanPath view:cache
Write-Host "Optimization completed." -ForegroundColor Green
Write-Host ""

# Step 5: Verify storage link
Write-Host "[5/5] Verifying storage link..." -ForegroundColor Yellow
$storagePath = "C:\sites\emc_abastos\current\public\storage"
if (-not (Test-Path $storagePath)) {
    Write-Host "Creating storage link..." -ForegroundColor Yellow
    & $phpPath $artisanPath storage:link
}
Write-Host "Storage link verified." -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " V11 DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes deployed:" -ForegroundColor White
Write-Host "  - Pickup/Delivery toggle per empresa" -ForegroundColor Gray
Write-Host "  - Checkout adapts to empresa fulfillment options" -ForegroundColor Gray
Write-Host "  - 6 Premium Themes V2 (Emerald Luxe, Minimal Platinum," -ForegroundColor Gray
Write-Host "    Dark Market, Fresh Produce, Modern Mono, Gold Accent)" -ForegroundColor Gray
Write-Host "  - React/Astro storefront structure (optional)" -ForegroundColor Gray
Write-Host "  - ThemeResolver enhanced with styles support" -ForegroundColor Gray
Write-Host ""
Write-Host "Admin Actions:" -ForegroundColor Yellow
Write-Host "  1. Go to Admin > Empresas > Edit" -ForegroundColor Gray
Write-Host "  2. Configure Pickup/Delivery in 'Pickup/Horarios' tab" -ForegroundColor Gray
Write-Host "  3. Select a Theme V2 in 'Tema' dropdown" -ForegroundColor Gray
Write-Host ""
Write-Host "Optional: To use React/Astro storefront:" -ForegroundColor Yellow
Write-Host "  cd storefront-react && npm install && npm run dev" -ForegroundColor Gray
Write-Host ""
