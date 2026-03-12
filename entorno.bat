@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title POS-iaDoS - Selector de Entorno

set "ROOT=%~dp0"

:: ============================================================
:: DETECTAR AMBIENTE ACTUAL
:: ============================================================
set "ENV_LABEL=SIN CONFIGURAR"
set "ENV_DB=N/A"
set "ENV_APP=N/A"
set "ENV_API=N/A"

set "BENV=%ROOT%backend\.env"
if exist "!BENV!" (
    for /f "usebackq delims=" %%L in ("!BENV!") do (
        set "LINE=%%L"
        set "LINE=!LINE: =!"
        if /i "!LINE:~0,8!"=="DB_HOST=" (
            set "ENV_DB=!LINE:~8!"
            set "ENV_DB=!ENV_DB:~0,-1!"
        )
    )
    if "!ENV_DB!"=="localhost"               set "ENV_LABEL=LOCAL"
    if "!ENV_DB!"=="127.0.0.1"              set "ENV_LABEL=LOCAL"
    if "!ENV_DB!"=="my.bodegadigital.com.mx" set "ENV_LABEL=EXTERNO"
)
call :set_urls

:: ============================================================
:MENU
:: ============================================================
cls
echo.
echo  ================================================================
echo    POS-iaDoS  ^|  Selector de Entorno
echo  ================================================================
echo.
echo    AMBIENTE  :  ^>^>  !ENV_LABEL!  ^<^<
echo    BD        :  !ENV_DB!
echo    App URL   :  !ENV_APP!
echo    API URL   :  !ENV_API!
echo.
echo  ----------------------------------------------------------------
echo.
echo    [1]  Cambiar a  LOCAL    (localhost)
echo    [2]  Cambiar a  EXTERNO  (my.bodegadigital.com.mx)
echo    [3]  Levantar servicios  (ambiente actual)
echo    [4]  Info OFFLINE / EXE
echo    [5]  Ver URLs de acceso
echo    [6]  Generar EXE instalador  (Local, version auto +1)
echo    [0]  Salir
echo.
echo  ----------------------------------------------------------------
echo.
set "OP="
set /p "OP=  Selecciona: "

if "!OP!"=="1" goto :CMD_LOCAL
if "!OP!"=="2" goto :CMD_EXTERNO
if "!OP!"=="3" goto :CMD_LEVANTAR
if "!OP!"=="4" goto :CMD_OFFLINE
if "!OP!"=="5" goto :CMD_URLS
if "!OP!"=="6" goto :CMD_BUILD
if "!OP!"=="0" goto :FIN

echo   Opcion invalida.
timeout /t 2 >nul
goto :MENU


:: ============================================================
:CMD_LOCAL
:: ============================================================
cls
echo.
echo  ================================================================
echo    Cambiando a LOCAL y levantando servicios
echo  ================================================================
echo.

echo  [1/4] Copiando .env LOCAL...
copy /Y "!ROOT!backend\loc.env"  "!ROOT!backend\.env"  >nul 2>&1
copy /Y "!ROOT!frontend\loc.env" "!ROOT!frontend\.env" >nul 2>&1
if errorlevel 1 (
    echo  ERROR copiando loc.env - verifica que existan backend\loc.env y frontend\loc.env
    pause
    goto :MENU
)
echo         OK

echo.
echo  [2/4] Liberando puertos...
call :KILL_PORT 3000
call :KILL_PORT 5173
echo.

echo  [3/4] Iniciando Backend...
start "POS Backend [LOCAL]" /D "!ROOT!backend" cmd /k "npm run start:dev"
echo         OK - ventana Backend abierta

echo.
echo  [4/4] Iniciando Frontend...
start "POS Frontend [LOCAL]" /D "!ROOT!frontend" cmd /k "npx vite --host 0.0.0.0"
echo         OK - ventana Frontend abierta

set "ENV_LABEL=LOCAL"
set "ENV_DB=localhost"
call :set_urls

echo.
echo  ================================================================
echo    LISTO  -  Ambiente LOCAL activo
echo    App  :  !ENV_APP!
echo    API  :  !ENV_API!
echo  ================================================================
echo.
pause
goto :MENU


:: ============================================================
:CMD_EXTERNO
:: ============================================================
cls
echo.
echo  ================================================================
echo    Cambiando a EXTERNO y levantando servicios
echo  ================================================================
echo.

echo  [1/4] Copiando .env EXTERNO...
copy /Y "!ROOT!backend\ext.env"  "!ROOT!backend\.env"  >nul 2>&1
copy /Y "!ROOT!frontend\ext.env" "!ROOT!frontend\.env" >nul 2>&1
if errorlevel 1 (
    echo  ERROR copiando ext.env - verifica que existan backend\ext.env y frontend\ext.env
    pause
    goto :MENU
)
echo         OK

echo.
echo  [2/4] Liberando puertos...
call :KILL_PORT 3000
call :KILL_PORT 5173
echo.

echo  [3/4] Iniciando Backend...
start "POS Backend [EXTERNO]" /D "!ROOT!backend" cmd /k "npm run start:dev"
echo         OK - ventana Backend abierta

echo.
echo  [4/4] Iniciando Frontend...
start "POS Frontend [EXTERNO]" /D "!ROOT!frontend" cmd /k "npx vite --host 0.0.0.0"
echo         OK - ventana Frontend abierta

set "ENV_LABEL=EXTERNO"
set "ENV_DB=my.bodegadigital.com.mx"
call :set_urls

echo.
echo  ================================================================
echo    LISTO  -  Ambiente EXTERNO activo
echo    App  :  !ENV_APP!
echo    API  :  !ENV_API!
echo  ================================================================
echo.
pause
goto :MENU


:: ============================================================
:CMD_LEVANTAR
:: ============================================================
cls
echo.
echo  ================================================================
echo    Levantando servicios  (ambiente: !ENV_LABEL!)
echo  ================================================================
echo.

if "!ENV_LABEL!"=="SIN CONFIGURAR" (
    echo  No hay ambiente configurado.
    echo  Selecciona [1] LOCAL o [2] EXTERNO primero.
    echo.
    pause
    goto :MENU
)

echo  [1/3] Liberando puertos...
call :KILL_PORT 3000
call :KILL_PORT 5173
echo.

echo  [2/3] Iniciando Backend...
start "POS Backend [!ENV_LABEL!]" /D "!ROOT!backend" cmd /k "npm run start:dev"
echo         OK - ventana Backend abierta

echo.
echo  [3/3] Iniciando Frontend...
start "POS Frontend [!ENV_LABEL!]" /D "!ROOT!frontend" cmd /k "npx vite --host 0.0.0.0"
echo         OK - ventana Frontend abierta

echo.
echo  ================================================================
echo    LISTO  -  Servicios levantados para !ENV_LABEL!
echo    App  :  !ENV_APP!
echo    API  :  !ENV_API!
echo    (el backend tarda ~15 seg en estar listo)
echo  ================================================================
echo.
pause
goto :MENU


:: ============================================================
:CMD_OFFLINE
:: ============================================================
cls
echo.
echo  ================================================================
echo    OFFLINE  (EXE Instalador)
echo  ================================================================
echo.
echo    Instala en: C:\POS-iaDoS\
echo.
echo    Generar nuevo EXE:
echo      cd installer
echo      powershell -ExecutionPolicy Bypass -File build-exe.ps1 -Version 2.x.x
echo.
echo    En el equipo offline:
echo      INICIAR.bat    - Inicia servicios
echo      DETENER.bat    - Detiene servicios
echo      ESTADO.bat     - Ver estado
echo.
pause
goto :MENU


:: ============================================================
:CMD_URLS
:: ============================================================
cls
echo.
echo  ================================================================
echo    URLs de acceso  (ambiente: !ENV_LABEL!)
echo  ================================================================
echo.
if "!ENV_LABEL!"=="LOCAL" (
    echo    App  (frontend)  :  http://localhost:5173
    echo    API  (backend)   :  http://localhost:3000/api
    echo    BD               :  localhost:3306  (pos_iados)
    echo.
    echo    Desde otra PC en la red:
    echo      Reemplaza localhost por la IP de esta maquina
    echo      Ejemplo: http://192.168.x.x:5173
) else if "!ENV_LABEL!"=="EXTERNO" (
    echo    App  (frontend)  :  http://34.71.132.26:5173
    echo    API  (backend)   :  http://34.71.132.26:3000/api
    echo    BD               :  my.bodegadigital.com.mx:3306
) else (
    echo    No hay ambiente configurado.
    echo    Selecciona [1] LOCAL o [2] EXTERNO primero.
)
echo.
echo  ================================================================
echo.
pause
goto :MENU


:: ============================================================
:set_urls
:: ============================================================
if "!ENV_LABEL!"=="LOCAL"   set "ENV_APP=http://localhost:5173"
if "!ENV_LABEL!"=="LOCAL"   set "ENV_API=http://localhost:3000/api"
if "!ENV_LABEL!"=="EXTERNO" set "ENV_APP=http://34.71.132.26:5173"
if "!ENV_LABEL!"=="EXTERNO" set "ENV_API=http://34.71.132.26:3000/api"
exit /b


:: ============================================================
:KILL_PORT
:: ============================================================
set "_P=%~1"
for /f "tokens=5" %%x in ('netstat -aon 2^>nul ^| findstr ":!_P! " ^| findstr "LISTENING"') do (
    if not "%%x"=="0" (
        taskkill /F /PID %%x >nul 2>&1
        echo         Puerto !_P!: PID %%x terminado
    )
)
exit /b


:: ============================================================
:CMD_BUILD
:: ============================================================
cls
echo.
echo  ================================================================
echo    Generar EXE Instalador  (modo local)
echo  ================================================================
echo.

:: --- Detectar version actual desde el version.json mas reciente ---
echo  Detectando version actual...
for /f "delims=" %%v in ('powershell -NoProfile -Command ^
  "$f = Get-ChildItem '!ROOT!installer\output\*-src\version.json' -ErrorAction SilentlyContinue ^| Sort-Object LastWriteTime -Descending ^| Select-Object -First 1; if ($f) { (Get-Content $f.FullName -Raw ^| ConvertFrom-Json).version } else { '2.2.0' }"') do set "VER_ACT=%%v"

:: --- Incrementar patch (x.y.Z -> x.y.Z+1) ---
for /f "delims=" %%v in ('powershell -NoProfile -Command ^
  "$v=[version]'!VER_ACT!'; '{0}.{1}.{2}' -f $v.Major,$v.Minor,($v.Build+1)"') do set "VER_NEW=%%v"

echo.
echo    Version actual  :  !VER_ACT!
echo    Version nueva   :  !VER_NEW!
echo    Modo            :  local  (MariaDB incluida)
echo    RuntimeSource   :  v1.0.0  (libs ya descargadas)
echo.
echo  ----------------------------------------------------------------
echo.
set "CBUILD="
set /p "CBUILD=  Confirmar build v!VER_NEW!? (s/N): "
if /i not "!CBUILD!"=="s" goto :MENU

echo.
echo  [1/4] Instalando/verificando dependencias npm del backend...
echo        (npm install - rapido si ya estan instaladas)
echo.
pushd "!ROOT!backend"
call npm install --prefer-offline
if errorlevel 1 (
    call npm install
)
popd
echo         OK - dependencias verificadas

echo.
echo  [2/4] Compilando TypeScript del backend...
echo        (puede tardar 30-60 seg, no cierres esta ventana)
echo.
pushd "!ROOT!backend"
call npx tsc -p tsconfig.json --outDir "!ROOT!installer\staging\app\backend\dist_new" --incremental false
if errorlevel 1 (
    popd
    echo.
    echo  ERROR en compilacion TypeScript.
    echo  Revisa los errores arriba antes de continuar.
    echo.
    pause
    goto :MENU
)
popd

echo         OK - TypeScript compilado

echo.
echo  [3/4] Actualizando dist en staging...
if exist "!ROOT!installer\staging\app\backend\dist" (
    rmdir /s /q "!ROOT!installer\staging\app\backend\dist" >nul 2>&1
)
rename "!ROOT!installer\staging\app\backend\dist_new" "dist" >nul 2>&1
echo         OK - staging\app\backend\dist actualizado

echo.
echo  [4/4] Lanzando Inno Setup como Administrador...
echo        (aparecera una ventana UAC - acepta para continuar)
echo.

:: Escribir launcher PS1 temporal (evita problemas de comillas anidadas)
(
echo Set-Location '!ROOT!installer'
echo ^& '.\build-exe.ps1' -Version '!VER_NEW!' -Mode local -RuntimeSource 'v1.0.0'
echo Write-Host ''
echo Read-Host 'Build terminado. Presiona Enter para cerrar'
) > "!ROOT!installer\_build_launcher.ps1"

powershell -NoProfile -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""!ROOT!installer\_build_launcher.ps1""' -Verb RunAs"

echo.
echo  ================================================================
echo    Build en progreso en la ventana PowerShell elevada.
echo    Cuando termine, el EXE estara en:
echo      !ROOT!installer\output\POS-iaDoS-Local-v!VER_NEW!.exe
echo.
echo    NOTA: Si falla la compilacion TypeScript, abre una terminal,
echo    ve a la carpeta backend\ y ejecuta: npm install
echo  ================================================================
echo.
pause
goto :MENU


:: ============================================================
:FIN
:: ============================================================
endlocal
