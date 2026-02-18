param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php = "C:\php\php.exe"
)

Set-Location $Root

function Upsert-EnvLine {
  param([string]$Key, [string]$Value)
  $envPath = Join-Path $Root ".env"
  if (!(Test-Path $envPath)) { throw ".env no existe en $envPath" }
  $lines = Get-Content $envPath -Raw -Encoding UTF8
  $pattern = "^(?m)" + [Regex]::Escape($Key) + "=.*$"
  if ($lines -match $pattern) {
    $lines = [Regex]::Replace($lines, $pattern, "$Key=$Value")
  } else {
    $lines = $lines.TrimEnd() + "`r`n$Key=$Value`r`n"
  }
  Set-Content -Path $envPath -Value $lines -Encoding UTF8
}

Write-Host "0) Forzar cache/session a FILE para evitar tocar tablas DB antes de migrar..."
Upsert-EnvLine -Key "CACHE_STORE" -Value "file"
Upsert-EnvLine -Key "SESSION_DRIVER" -Value "file"
Upsert-EnvLine -Key "QUEUE_CONNECTION" -Value "sync"

Write-Host "1) Composer autoload..."
composer dump-autoload -o

Write-Host "2) Limpiar caches (sin DB cache)..."
& $Php artisan config:clear
& $Php artisan cache:clear
& $Php artisan route:clear
& $Php artisan view:clear

Write-Host "3) Migrar con step + verbose y log..."
$log = Join-Path $Root "storage\logs\migrate_step_verbose.log"
& $Php artisan migrate --force -v --step *>&1 | Tee-Object -FilePath $log
Write-Host "Log: $log"

Write-Host "DONE ✅"
