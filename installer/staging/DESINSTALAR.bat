@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - Desinstalador
echo.
echo  ==========================================
echo    POS-iaDoS - Desinstalador
echo  ==========================================
echo.
echo  Esto quita POS-iaDoS de los servicios de Windows.
echo.
echo  TUS DATOS NO SE BORRAN: la base de datos y las
echo  imagenes se quedan en la carpeta de instalacion,
echo  y el instalador las vuelve a tomar si reinstalas.
echo.
set /p CONFIRM=  Escriba SI para continuar:
if /i not "%CONFIRM%"=="SI" (
    echo  Cancelado.
    pause
    exit /b
)

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

powershell -ExecutionPolicy Bypass -File "%~dp0tools\uninstall.ps1"

echo.
echo  ------------------------------------------
echo  Si tambien quieres BORRAR LOS DATOS (base de
echo  datos e imagenes), hay que pedirlo aparte.
echo  Se hace un respaldo fuera de la carpeta antes
echo  de borrar, y hay que escribir la frase completa.
echo.
set /p BORRAR=  Escriba BORRAR DATOS para borrarlos, o Enter para salir:
if /i not "%BORRAR%"=="BORRAR DATOS" (
    echo.
    echo  Listo. Los datos siguen ahi.
    pause
    exit /b
)
powershell -ExecutionPolicy Bypass -File "%~dp0tools\uninstall.ps1" -BorrarTodo
echo.
pause
