param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php = "C:\php\php.exe"
)

Set-Location $Root

Write-Host "0) Ensure dirs..."
$dirs = @(
  "bootstrap\cache",
  "storage\framework\cache\data",
  "storage\framework\sessions",
  "storage\framework\views",
  "storage\logs"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null }

Write-Host "1) Clear bootstrap cache..."
Remove-Item -Force .\bootstrap\cache\config.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\services.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\packages.php -ErrorAction SilentlyContinue

Write-Host "2) Composer autoload..."
composer dump-autoload -o

Write-Host "3) Clear app caches..."
& $Php artisan optimize:clear

Write-Host "4) Migrate (safe additive)..."
& $Php artisan migrate --force

Write-Host "5) Seed demo store (safe upserts)..."
& $Php artisan db:seed --class=Database\Seeders\DemoStoreSeeder --force

Write-Host "DONE ✅"
Write-Host "Test: /, /carrito, /checkout, /login"
