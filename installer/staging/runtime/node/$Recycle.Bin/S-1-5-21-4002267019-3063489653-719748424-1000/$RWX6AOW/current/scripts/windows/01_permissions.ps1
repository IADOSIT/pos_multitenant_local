param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$AppPool = "emc_abastos"
)

$paths = @(
  (Join-Path $Root "storage"),
  (Join-Path $Root "bootstrap\cache")
)

foreach ($p in $paths) {
  if (!(Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null }
  cmd /c "icacls `"$p`" /grant Users:(OI)(CI)M /T" | Out-Null
  cmd /c "icacls `"$p`" /grant `"IIS AppPool\$AppPool`":(OI)(CI)M /T" | Out-Null
}

Write-Host "Permissions OK"
