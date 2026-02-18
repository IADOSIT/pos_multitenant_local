param(
  [string]$Root = "C:\sites\emc_abastos\current"
)

Set-Location $Root

# Remove cached bootstrap config so .env + config files are reloaded
if (!(Test-Path ".\bootstrap\cache")) { New-Item -ItemType Directory -Force -Path ".\bootstrap\cache" | Out-Null }

Remove-Item -Force .\bootstrap\cache\config.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\services.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\packages.php -ErrorAction SilentlyContinue

php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear

Write-Host "OK"
