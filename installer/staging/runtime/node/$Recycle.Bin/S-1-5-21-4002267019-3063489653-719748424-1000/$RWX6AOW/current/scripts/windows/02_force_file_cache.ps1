param(
  [string]$Root = "C:\sites\emc_abastos\current"
)

$envFile = Join-Path $Root ".env"
if (!(Test-Path $envFile)) {
  Write-Error ".env not found at $envFile"
  exit 1
}

# Ensure both keys exist (Laravel versions vary)
$content = Get-Content $envFile -Raw

function Upsert-EnvLine([string]$text, [string]$key, [string]$value) {
  $pattern = "(?m)^\s*"+[regex]::Escape($key)+"\s*=.*$"
  if ($text -match $pattern) {
    return [regex]::Replace($text, $pattern, "$key=$value")
  } else {
    if (-not $text.EndsWith("`n")) { $text += "`n" }
    return $text + "$key=$value`n"
  }
}

$content = Upsert-EnvLine $content "CACHE_STORE" "file"
$content = Upsert-EnvLine $content "CACHE_DRIVER" "file"
$content = Upsert-EnvLine $content "SESSION_DRIVER" "file"

Set-Content -Path $envFile -Value $content -Encoding UTF8
Write-Host ".env updated: CACHE_STORE=file, CACHE_DRIVER=file, SESSION_DRIVER=file"

# Remove cached config so .env takes effect
$cacheDir = Join-Path $Root "bootstrap\cache"
if (Test-Path $cacheDir) {
  Remove-Item -Force (Join-Path $cacheDir "config.php") -ErrorAction SilentlyContinue
  Remove-Item -Force (Join-Path $cacheDir "packages.php") -ErrorAction SilentlyContinue
  Remove-Item -Force (Join-Path $cacheDir "services.php") -ErrorAction SilentlyContinue
}

Write-Host "Bootstrap cache files removed (config/services/packages)."
