# EMC Missing Pack (post-migrate)

## Copy files into your repo
Unzip into `C:\sites\emc_abastos\current\` and allow overwrite.

## Then run (PowerShell as Admin)
1) Permissions:
   powershell -ExecutionPolicy Bypass -File scripts\windows\01_permissions.ps1

2) Composer autoload:
   cd C:\sites\emc_abastos\current
   composer dump-autoload -o

3) Register command (if Kernel doesn't auto-discover):
   Add `\App\Console\Commands\EmcSmokeCheck::class` to app/Console/Kernel.php $commands.
   (see app/Console/Kernel.php.append.txt)

4) Seed + smoke:
   powershell -ExecutionPolicy Bypass -File scripts\windows\02_seed_and_smoke.ps1

5) Optional: run indexes:
   psql -U postgres -d emc_abastos -f db\POSTGRES_indexes_safe.sql

Default demo users (change passwords):
- superadmin@emc.local / ChangeMe#2026
- admin@abastos.local / ChangeMe#2026
- ops@abastos.local / ChangeMe#2026
