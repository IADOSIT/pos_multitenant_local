param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php = "C:\php\php.exe",
  [string]$ServiceName = "emc_abastos_queue"
)

# Requires NSSM installed and on PATH.
nssm install $ServiceName $Php "artisan queue:work --sleep=1 --tries=3"
nssm set $ServiceName AppDirectory $Root
nssm set $ServiceName DisplayName "EMC Abastos Queue Worker"
nssm set $ServiceName Start SERVICE_AUTO_START
nssm start $ServiceName
