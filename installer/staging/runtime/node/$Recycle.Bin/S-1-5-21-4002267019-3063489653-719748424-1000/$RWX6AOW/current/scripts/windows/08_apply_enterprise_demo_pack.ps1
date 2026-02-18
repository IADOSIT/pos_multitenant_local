param(
  [string]$Root = "C:\sites\emc_abastos\current"
)

Set-Location $Root

# Ensure view/storage dirs
$dirs = @(
  "resources\views\store",
  "resources\views\layouts",
  "resources\views\admin",
  "resources\views\admin\productos",
  "resources\views\ops\ordenes",
  "storage\framework\cache\data",
  "storage\framework\sessions",
  "storage\framework\views",
  "storage\logs"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null }

# Clear bootstrap cache
Remove-Item -Force .\bootstrap\cache\config.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\services.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\packages.php -ErrorAction SilentlyContinue

# Autoload + migrate + seed
composer dump-autoload -o
php artisan optimize:clear
php artisan migrate --force
php artisan db:seed --force

Write-Host "OK ✅  Abre: / (tienda), /carrito, /checkout, /login, /empresa"
