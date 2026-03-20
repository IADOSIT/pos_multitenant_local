@echo off
title POS-iaDoS -- Generar Parche Rapido
echo.
echo  Opciones:
echo    [Enter]  = Backend + Frontend (recomendado)
echo    B        = Solo Backend (cambios en .ts)
echo    F        = Solo Frontend (cambios en React)
echo.
set /p OPT="Opcion [Enter/B/F]: "

if /i "%OPT%"=="B" (
    powershell -ExecutionPolicy Bypass -File "%~dp0generar-parche.ps1" -SoloBackend
) else if /i "%OPT%"=="F" (
    powershell -ExecutionPolicy Bypass -File "%~dp0generar-parche.ps1" -SoloFrontend
) else (
    powershell -ExecutionPolicy Bypass -File "%~dp0generar-parche.ps1"
)
pause
