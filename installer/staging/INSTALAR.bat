@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Instalador v1.0.0
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       POS-iaDoS - Instalador v1.0.0     ║
echo  ║       Sistema Punto de Venta             ║
echo  ╚══════════════════════════════════════════╝
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
powershell -ExecutionPolicy Bypass -File "%~dp0setup\install.ps1" -InstallerPath "%~dp0"
echo.
if %errorlevel% equ 0 (
    echo  Instalacion completada exitosamente!
) else (
    echo  Hubo errores durante la instalacion. Revise los logs.
)
echo.
pause
