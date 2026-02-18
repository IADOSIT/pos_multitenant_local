# Fix: Target class [files] does not exist

Causa: config/app.php tenía providers incompletos (faltaba FilesystemServiceProvider).
Solución: reemplaza config/app.php con el de este pack y limpia caches.

1) Descomprime en:
   C:\sites\emc_abastos\current\

2) Ejecuta:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\07_fix_config_and_clear.ps1
