@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Parche v2.2.57

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo  ============================================
echo   POS-iaDoS - Aplicando Parche v2.2.57
echo  ============================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0aplicar-parche.ps1"
pause
