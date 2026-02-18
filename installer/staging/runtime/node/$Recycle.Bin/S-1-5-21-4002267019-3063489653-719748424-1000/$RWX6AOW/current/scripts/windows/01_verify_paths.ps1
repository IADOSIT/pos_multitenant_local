param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php  = "C:\php\php.exe",
  [string]$Nssm = "C:\tools\nssm\win64\nssm.exe"
)

Write-Host "Checking paths..."
$ok = $true

if (!(Test-Path $Root)) { Write-Error "Root not found: $Root"; $ok = $false }
if (!(Test-Path $Php))  { Write-Error "PHP not found: $Php"; $ok = $false }
if (!(Test-Path $Nssm)) { Write-Warning "NSSM not found yet: $Nssm (download + extract NSSM zip)"; }

if ($ok) { Write-Host "Base OK" } else { exit 1 }
