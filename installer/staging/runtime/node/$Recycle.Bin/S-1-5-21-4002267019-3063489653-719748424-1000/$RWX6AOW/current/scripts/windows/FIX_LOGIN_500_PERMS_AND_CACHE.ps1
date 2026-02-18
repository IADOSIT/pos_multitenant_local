param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$SiteName = "emc_abastos",
  [string]$Php = "C:\php\php.exe"
)

Write-Host "== EMC FIX: Login 500 (perms + cache/session sanity) ==" -ForegroundColor Cyan

# Paths we must be able to write
$Targets = @(
  (Join-Path $Root "bootstrap\cache"),
  (Join-Path $Root "storage"),
  (Join-Path $Root "storage\framework"),
  (Join-Path $Root "storage\framework\cache"),
  (Join-Path $Root "storage\framework\sessions"),
  (Join-Path $Root "storage\framework\views"),
  (Join-Path $Root "storage\logs")
)

foreach ($p in $Targets) {
  if (-not (Test-Path $p)) {
    New-Item -ItemType Directory -Path $p -Force | Out-Null
  }
}

# Load IIS module and detect app pool for the site
Import-Module WebAdministration -ErrorAction SilentlyContinue

$PoolName = $null
try {
  $site = Get-Item ("IIS:\Sites\" + $SiteName) -ErrorAction Stop
  # In some setups, the site root app is an application under the site
  # so we look at "/" app config
  $app = Get-WebApplication -Site $SiteName -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq "/" } | Select-Object -First 1
  if ($app -and $app.ApplicationPool) {
    $PoolName = $app.ApplicationPool
  }
} catch {}

if (-not $PoolName) {
  Write-Host "WARN: Could not detect AppPool from site '$SiteName'. Using common identity IIS_IUSRS + IUSR + Users." -ForegroundColor Yellow
} else {
  Write-Host "Detected AppPool for site '$SiteName': $PoolName" -ForegroundColor Green
}

# Identities to grant
$Identities = @("IIS_IUSRS","IUSR","Users")
if ($PoolName) { $Identities += ("IIS AppPool\" + $PoolName) }

# Apply permissions
foreach ($dir in $Targets) {
  Write-Host "Fixing permissions: $dir" -ForegroundColor Yellow

  # Remove readonly attribute if any
  attrib -R "$dir\*" /S /D 2>$null

  # Reset ACL then grant Modify
  icacls $dir /reset /T /C | Out-Null

  foreach ($id in $Identities) {
    icacls $dir /grant "${id}:(OI)(CI)M" /T /C | Out-Null
  }
}

# Write test files to prove writability
$test1 = Join-Path $Root "bootstrap\cache\can_write.txt"
$test2 = Join-Path $Root "storage\logs\can_write.txt"
"OK $(Get-Date -Format s)" | Set-Content -Path $test1 -Encoding UTF8
"OK $(Get-Date -Format s)" | Set-Content -Path $test2 -Encoding UTF8

Write-Host "Write tests created:" -ForegroundColor Green
Write-Host " - $test1"
Write-Host " - $test2"

# Clear Laravel caches
if (Test-Path $Php) {
  Write-Host "Running: php artisan optimize:clear" -ForegroundColor Cyan
  & $Php (Join-Path $Root "artisan") optimize:clear
} else {
  Write-Host "WARN: PHP not found at $Php. Skipping artisan." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "DONE. Now hit /login again." -ForegroundColor Green
