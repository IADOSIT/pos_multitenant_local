EMC Hotfix: store.index no definido (error 500)

Qué arregla:
- Registra el nombre de ruta 'store.index' para la ruta HOME '/' (si existe, le añade ->name('store.index');).
- Limpia vistas compiladas y caches (bootstrap/cache, storage/framework/views) para que no se quede el error por cache.
- Ejecuta `php artisan optimize:clear` si detecta PHP.

Cómo usar (PowerShell):
1) Descomprime este ZIP en: C:\sites\emc_abastos\current\
2) Ejecuta:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\07_fix_store_index_route_and_clear.ps1 -Root "C:\sites\emc_abastos\current" -Php "C:\php\php.exe"

Luego visita:
- http://emc_abastos.com/
