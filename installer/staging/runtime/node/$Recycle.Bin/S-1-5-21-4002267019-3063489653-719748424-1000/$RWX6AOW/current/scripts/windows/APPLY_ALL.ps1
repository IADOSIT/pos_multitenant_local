param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$AppPool = "emc_abastos"
)

Set-Location $Root

Write-Host "0) Ensure required directories..."
$dirs = @(
  "bootstrap\cache",
  "storage\app\public",
  "storage\framework\cache\data",
  "storage\framework\sessions",
  "storage\framework\views",
  "storage\logs",
  "resources\views"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null }

Write-Host "1) Permissions (IIS AppPool + Users) for storage/bootstrap..."
$permPaths = @(
  (Join-Path $Root "bootstrap\cache"),
  (Join-Path $Root "storage"),
  (Join-Path $Root "resources\views")
)
foreach ($p in $permPaths) {
  cmd /c "icacls `"$p`" /inheritance:e" | Out-Null
  cmd /c "icacls `"$p`" /grant Users:(OI)(CI)M /T" | Out-Null
  cmd /c "icacls `"$p`" /grant `"IIS AppPool\$AppPool`":(OI)(CI)M /T" | Out-Null
}

Write-Host "2) Force cache/session to file in .env (safe upsert)..."
$envFile = Join-Path $Root ".env"
if (!(Test-Path $envFile)) { throw ".env not found at $envFile" }

$content = Get-Content $envFile -Raw
function Upsert([string]$text, [string]$key, [string]$value) {
  $pattern = "(?m)^\s*"+[regex]::Escape($key)+"\s*=.*$"
  if ($text -match $pattern) { return [regex]::Replace($text, $pattern, "$key=$value") }
  if (-not $text.EndsWith("`n")) { $text += "`n" }
  return $text + "$key=$value`n"
}
$content = Upsert $content "CACHE_STORE" "file"
$content = Upsert $content "CACHE_DRIVER" "file"
$content = Upsert $content "SESSION_DRIVER" "file"
Set-Content -Path $envFile -Value $content -Encoding UTF8

Write-Host "3) Clear bootstrap caches (config/services/packages)..."
Remove-Item -Force .\bootstrap\cache\config.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\services.php -ErrorAction SilentlyContinue
Remove-Item -Force .\bootstrap\cache\packages.php -ErrorAction SilentlyContinue

Write-Host "4) Composer autoload..."
composer dump-autoload -o

Write-Host "5) Artisan clear/optimize..."
php artisan optimize:clear

Write-Host "6) Migrate + seed (non-destructive)..."
php artisan migrate --force
php artisan db:seed --force

Write-Host "7) Smoke check..."
php artisan emc:smoke-check

Write-Host "DONE ✅"
