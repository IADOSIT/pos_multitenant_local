param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php  = "C:\php\php.exe"
)

Write-Host "== EMC FIX: Route store.index missing ==" -ForegroundColor Cyan

$routes = Join-Path $Root "routes\web.php"
$ctrlDir = Join-Path $Root "app\Http\Controllers"
$ctrlFile = Join-Path $ctrlDir "StoreController.php"

if (-not (Test-Path $ctrlDir)) { New-Item -ItemType Directory -Path $ctrlDir -Force | Out-Null }

# 1) Create StoreController (safe minimal)
$ctrl = @'
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index()
    {
        // This view already exists in your project: resources/views/store/index.blade.php
        return view('store.index');
    }
}
'@

Set-Content -Path $ctrlFile -Value $ctrl -Encoding UTF8
Write-Host "Created: app/Http/Controllers/StoreController.php" -ForegroundColor Green

# 2) Ensure routes/web.php has store.index route and import
if (-not (Test-Path $routes)) {
  Write-Host "ERROR: routes/web.php not found at: $routes" -ForegroundColor Red
  exit 1
}

$web = Get-Content -Path $routes -Raw

# Add use statement if missing
if ($web -notmatch "use\s+App\\Http\\Controllers\\StoreController;") {
  # Insert after first <?php line if possible
  if ($web -match "<\?php") {
    $web = $web -replace "<\?php\s*", "<?php`r`n`r`nuse App\Http\Controllers\StoreController;`r`n"
  } else {
    $web = "<?php`r`n`r`nuse App\Http\Controllers\StoreController;`r`n`r`n" + $web
  }
}

# Remove any existing name('store.index') duplicates (avoid collisions)
$web = ($web -split "`r?`n") | Where-Object { $_ -notmatch "name\(['""]store\.index['""]\)" } | ForEach-Object { $_ } 
$web = ($web -join "`r`n")

# IMPORTANT: Ensure exactly one "/" route points to StoreController@index and is named store.index
# We will COMMENT OUT existing Route::get('/', ...) lines to prevent duplicate route errors.
$lines = $web -split "`r?`n"
for ($i=0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match "^\s*Route::get\(\s*['""]\/['""]\s*,") {
    if ($lines[$i] -notmatch "store\.index") {
      $lines[$i] = "// [EMC FIX] disabled old home route: " + $lines[$i]
    }
  }
}
$web = ($lines -join "`r`n")

# Append our guaranteed route (at end)
$append = @"



// [EMC FIX] required named route used by layouts/views
Route::get('/', [StoreController::class,'index'])->name('store.index');
"@

if ($web -notmatch "Route::get\(\s*'\s*\/\s*'\s*,\s*\[StoreController::class") {
  $web = $web + $append
}

Set-Content -Path $routes -Value $web -Encoding UTF8
Write-Host "Patched: routes/web.php (added store.index)" -ForegroundColor Green

# 3) Clear caches so Laravel picks up the new route
if (Test-Path $Php) {
  Write-Host "Clearing caches..." -ForegroundColor Cyan
  & $Php (Join-Path $Root "artisan") optimize:clear
  & $Php (Join-Path $Root "artisan") route:clear
  & $Php (Join-Path $Root "artisan") view:clear
} else {
  Write-Host "WARN: PHP not found at $Php. Skipping artisan cache clears." -ForegroundColor Yellow
}

Write-Host "DONE. Re-test /login and /" -ForegroundColor Green
