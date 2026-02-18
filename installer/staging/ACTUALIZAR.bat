@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Actualizador
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     POS-iaDoS - Actualizador             ║
echo  ╚══════════════════════════════════════════╝
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

powershell -ExecutionPolicy Bypass -File "%~dp0setup\update.ps1" -PatchPath "%~dp0"
echo.
pause
