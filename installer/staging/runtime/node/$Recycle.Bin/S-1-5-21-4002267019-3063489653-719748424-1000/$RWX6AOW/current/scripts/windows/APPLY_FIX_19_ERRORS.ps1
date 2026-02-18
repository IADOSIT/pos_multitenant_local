param(
    [string]$Root,
    [string]$Php
)

if (-not $Root) {
    $Root = "C:\sites\emc_abastos\current"
}

if (-not $Php) {
    $Php = "C:\php\php.exe"
}


$ErrorActionPreference = "Stop"

Write-Host "== EMC Hotfix: 19 errors =="

if (!(Test-Path $Root)) { throw "Root not found: $Root" }
Set-Location $Root

# 1) Ensure storage + bootstrap cache exist
$dirs = @(
  "$Root\storage",
  "$Root\storage\app",
  "$Root\storage\app\public",
  "$Root\storage\framework",
  "$Root\storage\framework\cache",
  "$Root\storage\framework\sessions",
  "$Root\storage\framework\views",
  "$Root\storage\logs",
  "$Root\bootstrap\cache"
)
foreach ($d in $dirs) { if (!(Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null } }

# 2) Harden .env (non destructive: only flips if found)
$envPath = Join-Path $Root ".env"
if (Test-Path $envPath) {
  $env = Get-Content $envPath -Raw
  $env = $env -replace "(?m)^APP_DEBUG\s*=\s*true\s*$", "APP_DEBUG=false"
  # DO NOT auto-change DB_PASSWORD if you already use it; just warn if admin123
  if ($env -match "(?m)^DB_PASSWORD\s*=\s*admin123\s*$") {
    Write-Host "WARN: DB_PASSWORD is admin123. Change it to a strong password."
  }
  Set-Content -Path $envPath -Value $env -Encoding UTF8
}

# 3) Composer autoload
Write-Host "Running composer dump-autoload..."
composer dump-autoload -o

# 4) Clear caches
& $Php artisan optimize:clear

# 5) Run migrations (adds missing columns safely)
& $Php artisan migrate --force

Write-Host "DONE. Re-test admin + ops + checkout."
