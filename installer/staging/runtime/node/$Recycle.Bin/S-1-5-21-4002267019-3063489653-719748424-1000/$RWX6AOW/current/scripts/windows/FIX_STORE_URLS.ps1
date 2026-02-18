# EMC Abastos - Fix Store URLs (use APP_URL instead of tiendas.emc.mx)
# Run as Administrator

param(
    [switch]$Apply
)

$sitePath = "C:\sites\emc_abastos\current"
$phpPath = "C:\php\php.exe"

Write-Host "=== Fix Store URLs ===" -ForegroundColor Cyan

if (-not $Apply) {
    Write-Host "`nThis script will:" -ForegroundColor Yellow
    Write-Host "1. Stop IIS"
    Write-Host "2. Update PortalConfig.php default fallback_domain"
    Write-Host "3. Update ResolveStoreContext.php"
    Write-Host "4. Update PortalController.php"
    Write-Host "5. Sync store_domains for all empresas"
    Write-Host "6. Clear caches"
    Write-Host "7. Restart IIS"
    Write-Host "`nRun with -Apply to execute" -ForegroundColor Yellow
    exit 0
}

# Stop IIS
Write-Host "`n[1/7] Stopping IIS..." -ForegroundColor Yellow
iisreset /stop

Start-Sleep -Seconds 2

# Update PortalConfig.php
Write-Host "[2/7] Updating PortalConfig.php..." -ForegroundColor Yellow
$file = "$sitePath\app\Models\PortalConfig.php"
$content = Get-Content $file -Raw
$content = $content -replace "'fallback_domain' => 'tiendas\.emc\.mx'", "'fallback_domain' => null"
Set-Content $file $content -NoNewline

# Update ResolveStoreContext.php
Write-Host "[3/7] Updating ResolveStoreContext.php..." -ForegroundColor Yellow
$file = "$sitePath\app\Http\Middleware\ResolveStoreContext.php"
$content = Get-Content $file -Raw
$content = $content -replace "\`$fallbackDomain = PortalConfig::get\('fallback_domain', 'tiendas\.emc\.mx'\);", "`$fallbackDomain = PortalConfig::get('fallback_domain') ?? parse_url(config('app.url'), PHP_URL_HOST);"
Set-Content $file $content -NoNewline

# Update PortalController.php
Write-Host "[4/7] Updating PortalController.php..." -ForegroundColor Yellow
$file = "$sitePath\app\Http\Controllers\Api\Public\PortalController.php"
$content = Get-Content $file -Raw
$content = $content -replace "'fallback_domain' => \`$config\['fallback_domain'\] \?\? 'tiendas\.emc\.mx'", "'base_url' => rtrim(config('app.url'), '/')"
Set-Content $file $content -NoNewline

# Sync store_domains
Write-Host "[5/7] Syncing store_domains for all empresas..." -ForegroundColor Yellow
$syncScript = @"
<?php
require '$sitePath/vendor/autoload.php';
`$app = require_once '$sitePath/bootstrap/app.php';
`$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Empresa;
use App\Models\StoreDomain;

`$empresas = Empresa::whereNotNull('handle')->get();
`$synced = 0;

foreach (`$empresas as `$empresa) {
    `$storePath = 't/' . `$empresa->handle;

    `$existing = StoreDomain::where('empresa_id', `$empresa->id)
        ->where('is_primary', true)
        ->first();

    if (`$existing) {
        if (`$existing->domain !== `$storePath) {
            `$existing->update(['domain' => `$storePath]);
            echo "Updated: {`$empresa->nombre} -> {`$storePath}\n";
            `$synced++;
        }
    } else {
        StoreDomain::create([
            'empresa_id' => `$empresa->id,
            'domain' => `$storePath,
            'is_primary' => true,
            'is_active' => true,
            'ssl_enabled' => true,
        ]);
        echo "Created: {`$empresa->nombre} -> {`$storePath}\n";
        `$synced++;
    }
}

echo "\nSynced {`$synced} store domains.\n";
"@

$syncScript | Out-File -FilePath "$sitePath\sync_domains.php" -Encoding UTF8
& $phpPath "$sitePath\sync_domains.php"
Remove-Item "$sitePath\sync_domains.php" -Force

# Clear caches
Write-Host "[6/7] Clearing caches..." -ForegroundColor Yellow
Push-Location $sitePath
& $phpPath artisan config:cache
& $phpPath artisan route:cache
& $phpPath artisan view:cache
& $phpPath artisan cache:clear
Pop-Location

# Start IIS
Write-Host "[7/7] Starting IIS..." -ForegroundColor Yellow
iisreset /start

Write-Host "`n=== DONE ===" -ForegroundColor Green
Write-Host @"

Store URLs now use APP_URL from .env:
- Before: https://tiendas.emc.mx/t/{handle}
- After:  $((Get-Content "$sitePath\.env" | Select-String "APP_URL=").ToString().Split("=")[1])/t/{handle}

All empresas now have store_domain entries with path t/{handle}.
Portal and admin links will use the main domain.

"@
