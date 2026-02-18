param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php  = "C:\php\php.exe",
  [string]$Nssm = "C:\tools\nssm\win64\nssm.exe",
  [string]$ServiceName = "emc_abastos_queue"
)

if (!(Test-Path $Root)) { throw "Root not found: $Root" }
if (!(Test-Path $Php))  { throw "PHP not found: $Php" }
if (!(Test-Path $Nssm)) { throw "NSSM not found: $Nssm. Download NSSM zip and extract win64\nssm.exe there." }

Write-Host "Installing/Updating NSSM service: $ServiceName"
& $Nssm stop $ServiceName 2>$null | Out-Null
& $Nssm remove $ServiceName confirm 2>$null | Out-Null

# Install
& $Nssm install $ServiceName $Php "artisan queue:work --sleep=1 --tries=3" | Out-Null
& $Nssm set $ServiceName AppDirectory $Root | Out-Null
& $Nssm set $ServiceName DisplayName "EMC Abastos Queue Worker" | Out-Null
& $Nssm set $ServiceName Start SERVICE_AUTO_START | Out-Null

# Optional: logs for stdout/stderr
$logDir = Join-Path $Root "storage\logs"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
& $Nssm set $ServiceName AppStdout (Join-Path $logDir "queue_stdout.log") | Out-Null
& $Nssm set $ServiceName AppStderr (Join-Path $logDir "queue_stderr.log") | Out-Null
& $Nssm set $ServiceName AppRotateFiles 1 | Out-Null
& $Nssm set $ServiceName AppRotateOnline 1 | Out-Null
& $Nssm set $ServiceName AppRotateBytes 10485760 | Out-Null

& $Nssm start $ServiceName | Out-Null
Write-Host "Service started: $ServiceName"
Write-Host "Check: sc query $ServiceName"
