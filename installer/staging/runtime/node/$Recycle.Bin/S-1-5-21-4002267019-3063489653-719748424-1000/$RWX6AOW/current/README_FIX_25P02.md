Este fix ataca el caso típico de SQLSTATE[25P02] en Windows/PostgreSQL:
- Si CACHE_STORE=database y no existe tabla cache, comandos artisan como cache:clear/optimize:clear pueden fallar al inicio y "ensuciar" la ejecución.
- Forzamos CACHE_STORE=file y SESSION_DRIVER=file antes de migrar.
- Corremos migrate con --step y -v para que el log muestre EL ERROR REAL (no solo 25P02).

Pasos:
1) Copia este pack encima del proyecto.
2) Ejecuta:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\FIX_25P02.ps1
3) Si falla, comparte el contenido de: storage\logs\migrate_step_verbose.log
