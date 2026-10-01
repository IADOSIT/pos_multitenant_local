@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Actualizador
echo.
echo  ==========================================
echo    POS-iaDoS - Actualizador
echo  ==========================================
echo.
echo  Antes de cambiar nada se respalda todo:
echo    - la base de datos completa
echo    - las imagenes
echo    - un Excel con todos los datos
echo    - los ajustes que tienes activados
echo.
echo  Si el sistema no vuelve a arrancar, regresa solo
echo  a como estaba. No se borra ningun dato.
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set "PATCH_PATH=%~dp0"
if "%PATCH_PATH:~-1%"=="\" set "PATCH_PATH=%PATCH_PATH:~0,-1%"
powershell -ExecutionPolicy Bypass -File "%PATCH_PATH%\setup\actualizar.ps1" -Paquete "%PATCH_PATH%"
echo.
if %errorlevel% equ 0 (
    echo  Actualizacion terminada. Lee ULTIMA-ACTUALIZACION.txt
) else (
    echo  Revisa el reporte. El respaldo esta en la carpeta backups.
)
echo.
pause
