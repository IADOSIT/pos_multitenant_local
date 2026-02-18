param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php  = "C:\php\php.exe"
)

Write-Host "== EMC Hotfix: remove dependency on route('store.index') + clear view cache =="

$viewDir = Join-Path $Root "storage\framework\views"
if (Test-Path $viewDir) {
  Write-Host "Clearing compiled views..."
  Remove-Item -Path (Join-Path $viewDir "*.php") -Force -ErrorAction SilentlyContinue
}

$cacheDir = Join-Path $Root "bootstrap\cache"
if (Test-Path $cacheDir) {
  Write-Host "Clearing bootstrap cache files..."
  Remove-Item -Path (Join-Path $cacheDir "routes-*.php") -Force -ErrorAction SilentlyContinue
  Remove-Item -Path (Join-Path $cacheDir "config.php") -Force -ErrorAction SilentlyContinue
  Remove-Item -Path (Join-Path $cacheDir "services.php") -Force -ErrorAction SilentlyContinue
  Remove-Item -Path (Join-Path $cacheDir "packages.php") -Force -ErrorAction SilentlyContinue
}

if (Test-Path $Php) {
  Write-Host "Running artisan clears..."
  & $Php (Join-Path $Root "artisan") view:clear | Out-Host
  & $Php (Join-Path $Root "artisan") route:clear | Out-Host
  & $Php (Join-Path $Root "artisan") optimize:clear | Out-Host
} else {
  Write-Host "WARN: PHP not found at $Php"
}

Write-Host "DONE. Refresh /"