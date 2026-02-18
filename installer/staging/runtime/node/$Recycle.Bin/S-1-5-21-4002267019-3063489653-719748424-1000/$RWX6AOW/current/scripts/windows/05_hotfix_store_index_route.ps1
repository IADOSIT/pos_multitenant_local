param(
    [string]$Root,
    [string]$Php
)
if (-not $Root) { $Root = "C:\sites\emc_abastos\current" }
if (-not $Php) { $Php = "C:\php\php.exe" }

$web = Join-Path $Root "routes\web.php"
if (-not (Test-Path $web)) { throw "No existe routes\web.php en $web" }

$content = Get-Content -Raw $web

# Ensure StoreController import
if ($content -notmatch "use\s+App\\Http\\Controllers\\StoreController;") {
  $content = $content -replace "(?s)<\?php\s*", "<?php`r`n`r`nuse App\Http\Controllers\StoreController;`r`n"
}

# Ensure route definition with name store.index
if ($content -notmatch "name\(['""]store\.index['""]\)") {
  if ($content -match "Route::get\(\s*['""]\/['""]\s*,\s*\[StoreController::class\s*,\s*['""]index['""]\]\s*\)") {
    $content = $content -replace "Route::get\(\s*['""]\/['""]\s*,\s*\[StoreController::class\s*,\s*['""]index['""]\]\s*\)\s*;","Route::get('/', [StoreController::class, 'index'])->name('store.index');"
  } else {
    $content += "`r`n`r`n// EMC hotfix: storefront home named route`r`nRoute::get('/', [StoreController::class, 'index'])->name('store.index');`r`n"
  }
}

Set-Content -Encoding UTF8 $web $content

Push-Location $Root
& $Php artisan route:clear | Out-Host
& $Php artisan optimize:clear | Out-Host
Pop-Location

Write-Host "OK: Ruta store.index aplicada. Reintenta /" -ForegroundColor Green
