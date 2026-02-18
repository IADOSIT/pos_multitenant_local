Este pack arregla el caso donde la migración 2026_02_05_120000 falla con SQLSTATE[25P02] antes de ejecutar nada.

La causa habitual:
- Laravel aún envuelve en transacción y cualquier fallo previo deja la conexión "aborted" -> luego hasTable() ya no funciona.

Solución:
- Reemplaza la migración 120000 por versión RAW (PostgreSQL) que:
  - no usa Schema::hasTable/hasColumn
  - corre fuera de transacción (withinTransaction=false)
  - usa DO $$ + to_regclass + ADD COLUMN IF NOT EXISTS

Aplicar:
1) Descomprime sobre C:\sites\emc_abastos\current\
2) Ejecuta:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\APPLY_FIX_120000_RAW.ps1
