param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php  = "C:\php\php.exe",
  [string]$TaskName = "EMC_Abastos_QueueWorker"
)

# Fallback if you cannot use NSSM.
# Creates a scheduled task that starts at boot and restarts every 5 minutes if ended.

if (!(Test-Path $Root)) { throw "Root not found: $Root" }
if (!(Test-Path $Php))  { throw "PHP not found: $Php" }

$action = New-ScheduledTaskAction -Execute $Php -Argument "artisan queue:work --sleep=1 --tries=3" -WorkingDirectory $Root
$trigger1 = New-ScheduledTaskTrigger -AtStartup
$trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)

# Run as SYSTEM (no password)
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($trigger1,$trigger2) -User "SYSTEM" -RunLevel Highest -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName
Write-Host "Task created and started: $TaskName"
Write-Host "Check: Get-ScheduledTask -TaskName $TaskName"
