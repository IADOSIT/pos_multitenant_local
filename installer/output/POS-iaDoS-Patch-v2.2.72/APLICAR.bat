@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Parche v2.2.72

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Se requieren permisos de administrador. Solicitando elevacion...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo  POS-iaDoS Parche v2.2.72
echo  ========================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0aplicar-parche.ps1" -PatchDir "%~dp0"
echo.
pause
