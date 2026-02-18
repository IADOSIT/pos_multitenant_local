# Fix store.index route not defined (Windows/IIS)
param(
    [string]$Root,
    [string]$Php
)
if (-not $Root) { $Root = "C:\sites\emc_abastos\current" }
if (-not $Php)  { $Php  = "C:\php\php.exe" }

Write-Host "== EMC Hotfix: store.index route + view fallback =="

$routesFile = Join-Path $Root "routes\web.php"
if (-not (Test-Path $routesFile)) { throw "routes\web.php not found at $routesFile" }

$routes = Get-Content $routesFile -Raw

# Ensure import
if ($routes -notmatch 'use\s+App\\Http\\Controllers\\StoreController;') {
    # insert after opening <?php
    $routes = $routes -replace '^\s*<\?php\s*', "<?php`r`n`r`nuse App\Http\Controllers\StoreController;`r`n"
}

# Ensure route definition
if ($routes -notmatch "name\('store\.index'\)") {
    # Prefer to place near top, after imports
    $insert = "Route::get('/', [StoreController::class, 'index'])->name('store.index');`r`n"
    if ($routes -match "use App\\Http\\Controllers\\StoreController;") {
        $routes = $routes -replace "(use App\\Http\\Controllers\\StoreController;(\r?\n)+)", "`$1$insert`r`n"
    } else {
        $routes = $insert + "`r`n" + $routes
    }
    Set-Content -Path $routesFile -Value $routes -Encoding UTF8
    Write-Host "OK: Added Route::get('/', ...)->name('store.index') to routes\web.php"
} else {
    Write-Host "OK: store.index route already present"
}

# Patch view to not depend on store.index (fallback to url('/'))
$viewFile = Join-Path $Root "resources\views\store\index.blade.php"
if (Test-Path $viewFile) {
    $view = Get-Content $viewFile -Raw
    $view2 = $view -replace "route\('store\.index'\)", "url('/')"
    if ($view2 -ne $view) {
        Set-Content -Path $viewFile -Value $view2 -Encoding UTF8
        Write-Host "OK: Patched store/index.blade.php route('store.index') -> url('/')"
    } else {
        Write-Host "OK: store/index.blade.php already safe"
    }
} else {
    Write-Host "WARN: store/index.blade.php not found (skipping view patch)"
}

# Clear caches
Write-Host "Clearing caches..."
& $Php (Join-Path $Root "artisan") optimize:clear | Out-Host
& $Php (Join-Path $Root "artisan") view:clear | Out-Host
& $Php (Join-Path $Root "artisan") route:clear | Out-Host

Write-Host "Route check:"
& $Php (Join-Path $Root "artisan") route:list | findstr /I "store.index" | Out-Host

Write-Host "DONE. Refresh: http://emc_abastos.com/"
