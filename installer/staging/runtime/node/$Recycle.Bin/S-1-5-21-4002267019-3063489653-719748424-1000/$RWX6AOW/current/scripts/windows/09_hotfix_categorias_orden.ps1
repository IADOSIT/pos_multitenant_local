param(
  [string]$Root = "C:\sites\emc_abastos\current"
)

Set-Location $Root

Remove-Item -Force .\bootstrap\cache\config.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\services.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\packages.php -ErrorAction SilentlyContinue

php artisan optimize:clear

# Reseed only demo store (safe upserts)
php artisan db:seed --class=Database\\Seeders\\DemoStoreSeeder --force

Write-Host "OK ✅ Hotfix aplicado. Abre / (tienda)."
