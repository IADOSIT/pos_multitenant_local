@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Instalador v2.2.0
echo.
echo  ==========================================
echo    POS-iaDoS - Instalador v2.2.0
echo    Sistema Punto de Venta
echo  ==========================================
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo  Ejecutando instalacion...
echo.
:: Quitar backslash final de %~dp0 para evitar escape de comillas en PowerShell
set "INST_PATH=%~dp0"
if "%INST_PATH:~-1%"=="\" set "INST_PATH=%INST_PATH:~0,-1%"
powershell -ExecutionPolicy Bypass -File "%INST_PATH%\setup\install.ps1" -InstallerPath "%INST_PATH%"
echo.
if %errorlevel% equ 0 (
    echo  Instalacion completada exitosamente!
) else (
    echo  Hubo errores durante la instalacion. Revise los logs.
)
echo.
pause
