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

Write-Host "1) Composer autoload..."
composer dump-autoload -o

Write-Host "2) Clear caches..."
& $Php artisan optimize:clear

Write-Host "3) Migrate..."
& $Php artisan migrate --force -v

Write-Host "4) Seed demo store..."
& $Php artisan db:seed --class=Database\Seeders\DemoStoreSeeder --force

Write-Host "DONE ✅ Phase1 stable"
