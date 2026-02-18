@echo off
:: ============================================================
:: EMC Abastos - Levantar Servicios (Double-click para ejecutar)
:: ============================================================

:: Verificar si es Admin, si no, re-ejecutar como Admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: Ejecutar el script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0START_SERVICES.ps1"
