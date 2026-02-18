param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$AppPool = "emc_abastos"
)

$paths = @(
  (Join-Path $Root "bootstrap\cache"),
  (Join-Path $Root "storage"),
  (Join-Path $Root "storage\framework"),
  (Join-Path $Root "storage\framework\cache"),
  (Join-Path $Root "storage\framework\cache\data"),
  (Join-Path $Root "storage\framework\sessions"),
  (Join-Path $Root "storage\framework\views"),
  (Join-Path $Root "storage\logs"),
  (Join-Path $Root "resources\views")
)

foreach ($p in $paths) {
  if (!(Test-Path $p)) {
    New-Item -ItemType Directory -Force -Path $p | Out-Null
  }

  cmd /c "icacls `"$p`" /inheritance:e" | Out-Null
  cmd /c "icacls `"$p`" /grant Users:(OI)(CI)M /T" | Out-Null
  cmd /c "icacls `"$p`" /grant `"IIS AppPool\$AppPool`":(OI)(CI)M /T" | Out-Null
}

Write-Host "Permissions applied to:"
$paths | ForEach-Object { Write-Host " - $_" }
Write-Host "OK"
