@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Desinstalador
echo.
echo  ==========================================
echo    POS-iaDoS - Desinstalador
echo  ==========================================
echo.
echo  ADVERTENCIA: Esto eliminara POS-iaDoS completamente,
echo  incluyendo la base de datos y todos los datos.
echo.
set /p CONFIRM=  Escriba SI para confirmar:
if /i not "%CONFIRM%"=="SI" (
    echo  Desinstalacion cancelada.
    pause
    exit /b
)

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

powershell -ExecutionPolicy Bypass -File "%~dp0setup\uninstall.ps1"
echo.
pause
