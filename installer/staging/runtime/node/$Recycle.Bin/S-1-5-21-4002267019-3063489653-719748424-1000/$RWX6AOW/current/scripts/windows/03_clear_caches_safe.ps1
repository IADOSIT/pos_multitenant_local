param(
  [string]$Root = "C:\sites\emc_abastos\current"
)

Set-Location $Root

php artisan config:clear

# cache:clear can fail if permissions are wrong; after running permissions script it should work.
php artisan cache:clear

# These should not touch DB
php artisan route:clear
php artisan view:clear

Write-Host "Clear caches done."
