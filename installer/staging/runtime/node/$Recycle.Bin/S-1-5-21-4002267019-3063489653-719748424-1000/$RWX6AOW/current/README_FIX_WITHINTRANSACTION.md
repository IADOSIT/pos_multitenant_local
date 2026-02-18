Fix: withinTransaction tipado rompe en PHP.
Reemplaza la migración 2026_02_05_120000_emc_schema_sync_enterprise.php por una versión donde:
- withinTransaction NO está tipado: public $withinTransaction = false;

Ejecuta:
powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\APPLY_FIX_WITHINTRANSACTION.ps1
