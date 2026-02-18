# EMC Fix Pack: permisos + cache (Windows)

## Qué corrige
- Error de Join-Path en scripts previos
- Falta de permisos para limpiar cache (file cache)
- Crea carpetas requeridas: bootstrap/cache, storage/framework/*, storage/logs, resources/views
- Fuerza CACHE_STORE/CACHE_DRIVER/SESSION_DRIVER a `file` y elimina config cache viejo

## Cómo usar (PowerShell **Como Administrador**)
1) Aplicar permisos:
   powershell -ExecutionPolicy Bypass -File scripts\windows\01_permissions_fix.ps1 -Root "C:\sites\emc_abastos\current" -AppPool "emc_abastos"

2) Forzar cache a file (edita .env):
   powershell -ExecutionPolicy Bypass -File scripts\windows\02_force_file_cache.ps1 -Root "C:\sites\emc_abastos\current"

3) Limpiar caches:
   powershell -ExecutionPolicy Bypass -File scripts\windows\03_clear_caches_safe.ps1 -Root "C:\sites\emc_abastos\current"

## Si aún falla cache:clear
- Verifica que ejecutaste el paso 1 como Admin
- Revisa que el AppPool name sea correcto.
