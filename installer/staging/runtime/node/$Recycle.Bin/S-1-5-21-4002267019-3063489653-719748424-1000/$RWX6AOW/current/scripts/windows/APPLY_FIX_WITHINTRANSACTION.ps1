param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php = "C:\php\php.exe"
)

Set-Location $Root
composer dump-autoload -o
& $Php artisan migrate --force -v --step
Write-Host "DONE ✅"
