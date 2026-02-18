param(
  [string]$Root = "C:\sites\emc_abastos\current"
)

Set-Location $Root
php artisan config:clear
php artisan db:seed --force
php artisan emc:smoke-check
