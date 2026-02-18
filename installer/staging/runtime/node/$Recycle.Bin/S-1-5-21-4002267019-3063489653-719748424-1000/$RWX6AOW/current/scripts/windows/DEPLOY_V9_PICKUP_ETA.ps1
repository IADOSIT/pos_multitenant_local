# EMC Abastos - V9 Pickup ETA System Deployment
# Run as Administrator

Write-Host "=== V9 Pickup ETA System ===" -ForegroundColor Cyan

$phpPath = "C:\php\php.exe"
$sitePath = "C:\sites\emc_abastos\current"

# Check PHP
if (!(Test-Path $phpPath)) {
    Write-Host "ERROR: PHP not found at $phpPath" -ForegroundColor Red
    exit 1
}

Push-Location $sitePath

try {
    Write-Host "`n[1/4] Running migrations..." -ForegroundColor Yellow
    & $phpPath artisan migrate --force
    if ($LASTEXITCODE -ne 0) { throw "Migration failed" }

    Write-Host "`n[2/4] Caching configuration..." -ForegroundColor Yellow
    & $phpPath artisan config:cache
    & $phpPath artisan route:cache
    & $phpPath artisan view:cache

    Write-Host "`n[3/4] Verifying empresas table..." -ForegroundColor Yellow
    $result = & $phpPath artisan tinker --execute="echo \App\Models\Empresa::first()?->pickup_eta_hours ?? 'Column exists';"
    Write-Host "Pickup ETA hours check: $result"

    Write-Host "`n[4/4] V9 Deployment complete!" -ForegroundColor Green
    Write-Host @"

=== V9 FEATURES DEPLOYED ===

1. PICKUP ETA SYSTEM
   - Empresas can now configure business hours (hora_atencion_inicio, hora_atencion_fin)
   - Configurable preparation time (pickup_eta_hours)
   - Admin: Empresas > Edit > Pickup/Horarios tab

2. CHECKOUT IMPROVEMENTS
   - Shows estimated pickup time when selecting "Recoger en tienda"
   - ETA calculated based on business hours
   - Orders spanning beyond business hours roll to next day

3. CONFIRMATION & TRACKING
   - Thanks page shows estimated ready time for pickup orders
   - Tracking page displays ETA with status colors
   - Special message when order is "lista" (ready)

4. WHATSAPP NOTIFICATIONS
   - Order created message includes: products, total, ETA
   - Status change includes pickup-ready message
   - Seller notifications include full order details

=== TESTING ===
1. Go to Admin > Empresas > Edit
2. Configure Pickup/Horarios tab
3. Create test order with "Recoger en tienda"
4. Verify ETA appears in checkout, thanks, and tracking

"@

} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
} finally {
    Pop-Location
}
