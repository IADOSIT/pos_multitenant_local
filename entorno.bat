@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title POS-iaDoS - Selector de Entorno

set "ROOT=%~dp0"
set "BACKEND_ENV=%ROOT%backend\.env"
set "CURRENT_ENV=SIN CONFIGURAR"
set "CURRENT_DB=N/A"
set "CURRENT_URL=N/A"

:: ============================================================
:: DETECTAR AMBIENTE ACTUAL leyendo backend\.env
:: ============================================================
if exist "%BACKEND_ENV%" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%BACKEND_ENV%") do (
        if /i "%%a"=="DB_HOST"      set "CURRENT_DB=%%b"
        if /i "%%a"=="FRONTEND_URL" set "CURRENT_URL=%%b"
    )
    if "!CURRENT_DB!"=="localhost"               set "CURRENT_ENV=LOCAL"
    if "!CURRENT_DB!"=="127.0.0.1"              set "CURRENT_ENV=LOCAL"
    if "!CURRENT_DB!"=="my.bodegadigital.com.mx" set "CURRENT_ENV=EXTERNO"
)

:: ============================================================
:: PANTALLA PRINCIPAL
:: ============================================================
:menu
cls
echo.
echo  ================================================================
echo    POS-iaDoS  ^|  Selector de Entorno
echo  ================================================================
echo.
echo    AMBIENTE ACTIVO :  ^>^>  !CURRENT_ENV!  ^<^<
echo    BD actual       :  !CURRENT_DB!
echo    URL actual      :  !CURRENT_URL!
echo.
echo  ----------------------------------------------------------------
echo.
echo    [1]  Cambiar a  LOCAL    ^(localhost / BD local^)
echo    [2]  Cambiar a  EXTERNO  ^(my.bodegadigital.com.mx^)
echo    [3]  Info       OFFLINE  ^(EXE instalador^)
echo    [0]  Salir
echo.
echo  ----------------------------------------------------------------
echo.
set "OPCION="
set /p "OPCION=  Selecciona una opcion: "

if "%OPCION%"=="1" goto :hacer_local
if "%OPCION%"=="2" goto :hacer_externo
if "%OPCION%"=="3" goto :info_offline
if "%OPCION%"=="0" goto :fin

echo.
echo  Opcion invalida. Intenta de nuevo.
timeout /t 2 >nul
goto :menu


:: ============================================================
:hacer_local
:: ============================================================
cls
echo.
echo  ================================================================
echo    Cambiando a LOCAL
echo  ================================================================
echo.

if "!CURRENT_ENV!"=="LOCAL" (
    echo    Ya estas en LOCAL. Reiniciando servicios de todas formas.
    echo.
)

echo    [1/4] Copiando .env para LOCAL...
copy /Y "%ROOT%backend\loc.env"  "%ROOT%backend\.env"  >nul 2>&1
copy /Y "%ROOT%frontend\loc.env" "%ROOT%frontend\.env" >nul 2>&1
echo          OK - backend\.env  ^<-- loc.env
echo          OK - frontend\.env ^<-- loc.env
echo.

echo    [2/4] Liberando puertos 3000 y 5173...
call :kill_port 3000
call :kill_port 5173
echo.

echo    [3/4] Iniciando Backend...
start "POS Backend [LOCAL]" /D "%ROOT%backend" cmd /k "npm run start:dev"
echo          OK - ventana "POS Backend [LOCAL]" abierta
echo.

echo    [4/4] Iniciando Frontend...
start "POS Frontend [LOCAL]" /D "%ROOT%frontend" cmd /k "npx vite --host 0.0.0.0"
echo          OK - ventana "POS Frontend [LOCAL]" abierta
echo.

echo  ================================================================
echo    AMBIENTE: LOCAL
echo    BD      : localhost:3306  ^(pos_iados^)
echo    API     : http://localhost:3000/api
echo    App     : http://localhost:5173
echo  ================================================================
echo.
echo    El backend sincronizara el schema automaticamente al arrancar.
echo    Revisa la ventana "POS Backend [LOCAL]" para ver el SchemaSync.
echo.
pause
goto :fin


:: ============================================================
:hacer_externo
:: ============================================================
cls
echo.
echo  ================================================================
echo    Cambiando a EXTERNO
echo  ================================================================
echo.

if "!CURRENT_ENV!"=="EXTERNO" (
    echo    Ya estas en EXTERNO. Reiniciando servicios de todas formas.
    echo.
)

echo    [1/4] Copiando .env para EXTERNO...
copy /Y "%ROOT%backend\ext.env"  "%ROOT%backend\.env"  >nul 2>&1
copy /Y "%ROOT%frontend\ext.env" "%ROOT%frontend\.env" >nul 2>&1
echo          OK - backend\.env  ^<-- ext.env
echo          OK - frontend\.env ^<-- ext.env
echo.

echo    [2/4] Liberando puertos 3000 y 5173...
call :kill_port 3000
call :kill_port 5173
echo.

echo    [3/4] Iniciando Backend...
start "POS Backend [EXTERNO]" /D "%ROOT%backend" cmd /k "npm run start:dev"
echo          OK - ventana "POS Backend [EXTERNO]" abierta
echo.

echo    [4/4] Iniciando Frontend...
start "POS Frontend [EXTERNO]" /D "%ROOT%frontend" cmd /k "npx vite --host 0.0.0.0"
echo          OK - ventana "POS Frontend [EXTERNO]" abierta
echo.

echo  ================================================================
echo    AMBIENTE: EXTERNO
echo    BD      : my.bodegadigital.com.mx:3306
echo    API     : http://34.71.132.26:3000/api
echo    App     : http://34.71.132.26:5173
echo  ================================================================
echo.
echo    IMPORTANTE: El backend validara y sincronizara el schema
echo    de la BD externa automaticamente al arrancar.
echo    Revisa la ventana "POS Backend [EXTERNO]" para ver el SchemaSync.
echo.
pause
goto :fin


:: ============================================================
:info_offline
:: ============================================================
cls
echo.
echo  ================================================================
echo    SERVIDOR OFFLINE  ^(EXE Instalador^)
echo  ================================================================
echo.
echo    El servidor OFFLINE es un equipo aislado gestionado
echo    con el EXE instalador. No requiere cambio de ambiente aqui.
echo.
echo    GENERAR NUEVO EXE:
echo      cd installer
echo      powershell -ExecutionPolicy Bypass -File build.ps1
echo.
echo    El EXE instala en: C:\POS-iaDoS\
echo    Gestion en el equipo OFFLINE:
echo      INICIAR.bat    - Inicia servicios
echo      DETENER.bat    - Detiene servicios
echo      ESTADO.bat     - Ver estado
echo      ACTUALIZAR.bat - Aplica actualizacion
echo.
echo    SCHEMA: El instalador sincroniza tablas automaticamente
echo    al arrancar el backend. El ACTUALIZAR.bat aplica schema
echo    incremental antes de reiniciar.
echo.
pause
goto :menu


:: ============================================================
:: Subrutina: matar procesos en el puerto dado
:: ============================================================
:kill_port
set "_PORT=%~1"
set "_KILLED=0"
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%_PORT% " ^| findstr "LISTENING"') do (
    if not "%%p"=="0" (
        taskkill /F /PID %%p >nul 2>&1
        if !errorlevel! equ 0 (
            echo          Puerto !_PORT!: proceso %%p terminado OK
            set "_KILLED=1"
        ) else (
            echo          Puerto !_PORT!: no se pudo terminar PID %%p
        )
    )
)
if "!_KILLED!"=="0" echo          Puerto !_PORT!: ya estaba libre
exit /b


:: ============================================================
:fin
:: ============================================================
endlocal
