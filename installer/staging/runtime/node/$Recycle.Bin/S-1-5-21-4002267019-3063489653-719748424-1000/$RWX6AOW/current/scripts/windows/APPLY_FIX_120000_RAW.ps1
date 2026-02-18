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

Write-Host "0) Forzar cache/session a FILE antes de migrar..."
Upsert-EnvLine -Key "CACHE_STORE" -Value "file"
Upsert-EnvLine -Key "SESSION_DRIVER" -Value "file"
Upsert-EnvLine -Key "QUEUE_CONNECTION" -Value "sync"

Write-Host "1) Verificar que el archivo fue sobre-escrito..."
Select-String -Path ".\database\migrations\2026_02_05_120000_emc_schema_sync_enterprise.php" -Pattern "withinTransaction" | Select-Object -First 3

Write-Host "2) Autoload + clear..."
composer dump-autoload -o
& $Php artisan optimize:clear

Write-Host "3) Migrar (step+verbose)..."
& $Php artisan migrate --force -v --step

Write-Host "DONE ✅"
