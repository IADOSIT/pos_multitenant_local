# EMC Unify Pack (Laravel 11 consistent)

Este pack corrige el conflicto Laravel 11 vs legacy:
- bootstrap/app.php (Laravel 11) con aliases 'empresa' y 'role'
- bootstrap/providers.php
- config/app.php usando ServiceProvider::defaultProviders() (evita "Target class [files]")
- app/Http/Kernel.php real (compatibilidad)
- routes/console.php
- Script único APPLY_ALL.ps1

## Instalar
1) Descomprime sobre:
   C:\sites\emc_abastos\current\

2) PowerShell Admin:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\APPLY_ALL.ps1

Luego abre:
- http://emc_abastos.com/login
- /empresa (selección de empresa)
- /admin/productos
- /ops/ordenes
