@echo off
title POS-iaDoS Bridge Bascula
echo Iniciando bridge de bascula...
echo.
echo Asegurarse de que la bascula este conectada por USB/serial
echo y que el puerto COM configurado en .env sea el correcto.
echo.
cd /d "%~dp0"
npm start
pause
