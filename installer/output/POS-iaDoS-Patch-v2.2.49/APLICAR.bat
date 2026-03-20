@echo off
echo Aplicando parche POS-iaDoS v2.2.49...
powershell -ExecutionPolicy Bypass -File "%~dp0aplicar-parche.ps1"
pause
