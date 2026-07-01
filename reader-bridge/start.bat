@echo off
title POS-iaDoS Bridge Biometrico
echo Iniciando bridge biometrico...
echo.
echo Asegurarse de que DpHostW.exe este corriendo (driver HID instalado)
echo Verificar: tasklist | findstr DpHostW
echo.
cd /d "%~dp0"
npm start
pause
