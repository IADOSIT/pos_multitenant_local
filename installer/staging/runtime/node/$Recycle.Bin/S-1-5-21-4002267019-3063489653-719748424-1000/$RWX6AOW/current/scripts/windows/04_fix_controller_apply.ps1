param(
  [string]$Root = "C:\sites\emc_abastos\current"
)

Set-Location $Root
composer dump-autoload -o
php artisan optimize:clear
Write-Host "OK: Controller base added, autoload optimized, caches cleared."
