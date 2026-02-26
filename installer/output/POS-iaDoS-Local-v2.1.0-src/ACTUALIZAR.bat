@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Actualizador
echo.
echo  ==========================================
echo    POS-iaDoS - Actualizador
echo  ==========================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set "PATCH_PATH=%~dp0"
if "%PATCH_PATH:~-1%"=="\" set "PATCH_PATH=%PATCH_PATH:~0,-1%"
powershell -ExecutionPolicy Bypass -File "%PATCH_PATH%\setup\update.ps1" -PatchPath "%PATCH_PATH%"
echo.
pause
