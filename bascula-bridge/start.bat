@echo off
title POS-iaDoS Bridge Bascula
cd /d "%~dp0"

if not exist node_modules (
  echo Instalando dependencias, esto puede tardar 1-2 minutos...
  echo.
  call npm install
)

echo Iniciando bridge de bascula...
echo.
echo Asegurarse de que la bascula este conectada por USB/serial
echo y que el puerto COM configurado en .env sea el correcto.
echo.
npm start
pause
