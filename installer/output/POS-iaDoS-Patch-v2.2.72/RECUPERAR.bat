@echo off
chcp 65001 >nul 2>&1
title POS-iaDoS - RECUPERACION DE EMERGENCIA

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo  POS-iaDoS - RECUPERACION DE EMERGENCIA
echo  ========================================
echo.
echo  Paso 1: Matando procesos node.exe...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 3 /nobreak >nul
echo  OK

echo  Paso 2: Deteniendo servicio...
sc stop PosIaDos-Backend >nul 2>&1
net stop PosIaDos-Backend >nul 2>&1
timeout /t 4 /nobreak >nul
echo  OK

echo  Paso 3: Copiando backend dist...
if exist "C:\POS-iaDoS\backend\dist\" (
    rmdir /S /Q "C:\POS-iaDoS\backend\dist\" 2>nul
)
xcopy "%~dp0backend\dist\" "C:\POS-iaDoS\backend\dist\" /E /I /H /Y >nul
echo  OK

echo  Paso 4: Copiando frontend public...
if exist "C:\POS-iaDoS\backend\public\" (
    rmdir /S /Q "C:\POS-iaDoS\backend\public\" 2>nul
)
xcopy "%~dp0backend\public\" "C:\POS-iaDoS\backend\public\" /E /I /H /Y >nul
echo  OK

echo  Paso 5: Iniciando servicio...
sc start PosIaDos-Backend >nul 2>&1
timeout /t 8 /nobreak >nul

echo  Paso 6: Verificando...
sc query PosIaDos-Backend | findstr /i "STATE"

echo.
echo  Esperando que el backend responda (30s)...
set /a intentos=0
:check
timeout /t 3 /nobreak >nul
powershell -Command "try { $r=(Invoke-WebRequest -Uri http://localhost:3000/api/health -UseBasicParsing -TimeoutSec 2).StatusCode; if($r -eq 200){exit 0}else{exit 1} } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 goto ok
set /a intentos+=1
if %intentos% lss 10 goto check

echo  AVISO: Backend no responde aun. Revisa el log:
echo  type "C:\POS-iaDoS\logs\backend-stderr.log"
echo.
echo  Intenta abrir: http://localhost:3000
goto fin

:ok
echo.
echo  ========================================
echo  SISTEMA RECUPERADO - Backend funcionando
echo  Abre http://localhost:3000
echo  ========================================

:fin
echo.
pause
