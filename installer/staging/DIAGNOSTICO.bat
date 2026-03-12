@echo off
setlocal EnableDelayedExpansion
title POS-iaDoS Diagnostico

set "D=C:\POS-iaDoS"
set "MYSQL=%D%\mariadb\bin\mysql.exe"
set "NODE=%D%\node\node.exe"
set "NM=C:/POS-iaDoS/backend/node_modules"
set "DBU=pos_iados"
set "DBP=pos_iados_2024"
set "DBN=pos_iados"
set "DBR=P0s_R00t_2024!"
set "SDB=PosIaDos-MariaDB"
set "SBE=PosIaDos-Backend"
set "LOG=%D%\logs\diagnostico.txt"
set "TMP=%D%\logs\_diag.js"
set "CNT=0"
set "HA="
set "HC="

if not exist "%D%\logs" mkdir "%D%\logs"

cls
echo.
echo ================================================================
echo   POS-iaDoS - Diagnostico
echo ================================================================
echo   Instalacion : %D%
echo   Log         : %LOG%
echo.
echo ===== DIAGNOSTICO %DATE% %TIME% ===== > "%LOG%"

:: ----------------------------------------------------------------
:: 1. SERVICIOS
:: ----------------------------------------------------------------
echo [1] SERVICIOS
echo [1] SERVICIOS >> "%LOG%"

sc query %SDB% >nul 2>&1
if errorlevel 1 (
    echo   %SDB% : NO EXISTE
    echo   %SDB%: NO EXISTE >> "%LOG%"
) else (
    for /f "tokens=4" %%T in ('sc query %SDB% ^| findstr STATE') do (
        echo   %SDB% : %%T
        echo   %SDB%: %%T >> "%LOG%"
    )
)

sc query %SBE% >nul 2>&1
if errorlevel 1 (
    echo   %SBE% : NO EXISTE
    echo   %SBE%: NO EXISTE >> "%LOG%"
) else (
    for /f "tokens=4" %%T in ('sc query %SBE% ^| findstr STATE') do (
        echo   %SBE% : %%T
        echo   %SBE%: %%T >> "%LOG%"
    )
)

:: ----------------------------------------------------------------
:: 2. PUERTOS
:: ----------------------------------------------------------------
echo.
echo [2] PUERTOS
echo [2] PUERTOS >> "%LOG%"

netstat -aon 2>nul | findstr ":3000 " | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo   3000 Backend : CERRADO
    echo   3000: CERRADO >> "%LOG%"
    set "BACKEND_CERRADO=1"
) else (
    echo   3000 Backend : ABIERTO OK
    echo   3000: ABIERTO >> "%LOG%"
    set "BACKEND_CERRADO=0"
)

netstat -aon 2>nul | findstr ":3306 " | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo   3306 MariaDB : CERRADO
    echo   3306: CERRADO >> "%LOG%"
) else (
    echo   3306 MariaDB : ABIERTO OK
    echo   3306: ABIERTO >> "%LOG%"
)

:: ----------------------------------------------------------------
:: 3. RUTAS
:: ----------------------------------------------------------------
echo.
echo [3] RUTAS
echo [3] RUTAS >> "%LOG%"

if exist "%MYSQL%"                  (echo   OK : mysql.exe)          else (echo   FALTA : %MYSQL%)
if exist "%NODE%"                   (echo   OK : node.exe)           else (echo   FALTA : %NODE%)
if exist "%D%\backend\dist\main.js" (echo   OK : backend\dist\main.js) else (echo   FALTA : %D%\backend\dist\main.js)
if exist "%D%\backend\.env"         (echo   OK : backend\.env)       else (echo   FALTA : %D%\backend\.env)

if exist "%MYSQL%"                  (echo   OK: mysql.exe >> "%LOG%")          else (echo   FALTA: %MYSQL% >> "%LOG%")
if exist "%NODE%"                   (echo   OK: node.exe >> "%LOG%")           else (echo   FALTA: dist\main.js >> "%LOG%")
if exist "%D%\backend\dist\main.js" (echo   OK: backend dist >> "%LOG%")       else (echo   FALTA: dist\main.js >> "%LOG%")
if exist "%D%\backend\.env"         (echo   OK: .env >> "%LOG%")               else (echo   FALTA: .env >> "%LOG%")

:: Verificar modulos criticos
set "MISSING_MODS=0"
if not exist "%D%\backend\node_modules\@nestjs\schedule" (
    echo   FALTA: node_modules\@nestjs\schedule  ^<-- causa que backend no arranque
    echo   FALTA: @nestjs/schedule >> "%LOG%"
    set "MISSING_MODS=1"
)
if not exist "%D%\backend\node_modules\exceljs" (
    echo   FALTA: node_modules\exceljs
    echo   FALTA: exceljs >> "%LOG%"
    set "MISSING_MODS=1"
)

if "%MISSING_MODS%"=="1" (
    echo.
    echo   *** MODULOS FALTANTES - intentando reparar ***
    echo   Buscando fuente en C:\sites\pos_multitenant_local\installer\staging\app\backend\node_modules...
    set "SRCNM=C:\sites\pos_multitenant_local\installer\staging\app\backend\node_modules"
    set "DESTNM=%D%\backend\node_modules"
    if exist "!SRCNM!\@nestjs\schedule" (
        if not exist "!DESTNM!\@nestjs\schedule" (
            xcopy "!SRCNM!\@nestjs\schedule" "!DESTNM!\@nestjs\schedule\" /E /I /Q >nul 2>&1
            echo   COPIADO: @nestjs/schedule
        )
    )
    if exist "!SRCNM!\exceljs" (
        if not exist "!DESTNM!\exceljs" (
            xcopy "!SRCNM!\exceljs" "!DESTNM!\exceljs\" /E /I /Q >nul 2>&1
            echo   COPIADO: exceljs
        )
    )
    if exist "!SRCNM!\@sinonjs" (
        if not exist "!DESTNM!\@sinonjs" (
            xcopy "!SRCNM!\@sinonjs" "!DESTNM!\@sinonjs\" /E /I /Q >nul 2>&1
        )
    )
    if exist "!SRCNM!\cron" (
        if not exist "!DESTNM!\cron" (
            xcopy "!SRCNM!\cron" "!DESTNM!\cron\" /E /I /Q >nul 2>&1
            echo   COPIADO: cron
        )
    )
    echo   Reparacion de modulos completada.
    echo   Modulos reparados >> "%LOG%"
)

:: ----------------------------------------------------------------
:: 3b. BACKEND ERROR LOG (cuando port 3000 esta cerrado)
:: ----------------------------------------------------------------
if "%BACKEND_CERRADO%"=="1" (
    echo.
    echo   *** BACKEND NO CORRE - Ultimas lineas de backend-stderr.log: ***
    echo   *** BACKEND NO CORRE *** >> "%LOG%"
    if exist "%D%\logs\backend-stderr.log" (
        echo   --- backend-stderr.log (ultimas 15 lineas) ---
        powershell -Command "Get-Content '%D%\logs\backend-stderr.log' -Tail 15 -ErrorAction SilentlyContinue" 2>nul
        echo   --- >> "%LOG%"
        powershell -Command "Get-Content '%D%\logs\backend-stderr.log' -Tail 15 -ErrorAction SilentlyContinue" >> "%LOG%" 2>nul
    ) else (
        echo   (backend-stderr.log no existe aun)
    )
)

:: ----------------------------------------------------------------
:: 4. USUARIOS EN BD
:: ----------------------------------------------------------------
echo.
echo [4] USUARIOS EN BD
echo [4] USUARIOS >> "%LOG%"

if not exist "%MYSQL%" (
    echo   mysql.exe no encontrado
    echo   mysql.exe no encontrado >> "%LOG%"
    goto SKIP_DB
)

"%MYSQL%" -u%DBU% -p%DBP% %DBN% -e "SELECT 1" >nul 2>&1
if not errorlevel 1 goto DB_CONN_OK

echo   Conexion con %DBU% fallo, probando root...
"%MYSQL%" -uroot -p%DBR% %DBN% -e "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo   Conexion root fallo. MariaDB caido o contrasena incorrecta.
    echo   Conexion: FALLO >> "%LOG%"
    goto SKIP_DB
)
set "DBU=root"
set "DBP=%DBR%"
echo   Conectado como root OK

:DB_CONN_OK
echo   Conexion BD: OK
echo   Conexion BD: OK >> "%LOG%"

set "CNT=0"
for /f %%C in ('"%MYSQL%" -u%DBU% -p%DBP% %DBN% -se "SELECT COUNT(*) FROM users" 2^>nul') do set "CNT=%%C"
echo   Usuarios en tabla: %CNT%
echo   Usuarios: %CNT% >> "%LOG%"

if "%CNT%"=="0" goto EMPTY_USERS

"%MYSQL%" -u%DBU% -p%DBP% %DBN% --table -e "SELECT id,email,rol,activo,LEFT(password,25) AS hash FROM users ORDER BY id" 2>nul
"%MYSQL%" -u%DBU% -p%DBP% %DBN% --table -e "SELECT id,email,rol,activo,LEFT(password,25) AS hash FROM users ORDER BY id" >> "%LOG%" 2>nul
"%MYSQL%" -u%DBU% -p%DBP% %DBN% -se "SELECT email,password FROM users ORDER BY id" >> "%LOG%" 2>nul

for /f %%H in ('"%MYSQL%" -u%DBU% -p%DBP% %DBN% -se "SELECT password FROM users WHERE id=1" 2^>nul') do set "HA=%%H"
for /f %%H in ('"%MYSQL%" -u%DBU% -p%DBP% %DBN% -se "SELECT password FROM users WHERE id=3" 2^>nul') do set "HC=%%H"
goto SKIP_DB

:EMPTY_USERS
echo.
echo   *** TABLA USERS VACIA - SEED NO APLICADO ***
echo   PROBLEMA: tabla users vacia >> "%LOG%"
echo.
set /p "APLIC=  Aplicar seed y reparar passwords? (s/N): "
if /i "%APLIC%"=="s" goto APPLY_SEED
echo   Seed no aplicado.
goto SKIP_DB

:APPLY_SEED
set "SEED=%D%\database\03_seed_datos_iniciales.sql"
if not exist "%SEED%" set "SEED=%D%\database\02_seeds.sql"
if not exist "%SEED%" (
    echo   Seed no encontrado en %D%\database\
    echo   Seed no encontrado >> "%LOG%"
    goto SKIP_DB
)
echo   Aplicando seed: %SEED%
echo   Aplicando seed >> "%LOG%"

:: Mostrar errores del seed (sin suprimir) para diagnostico
"%MYSQL%" -uroot -p%DBR% %DBN% < "%SEED%" 2>&1 | findstr /i "ERROR warn" 2>nul
"%MYSQL%" -uroot -p%DBR% %DBN% < "%SEED%" >> "%LOG%" 2>&1

set "CNT=0"
for /f %%C in ('"%MYSQL%" -u%DBU% -p%DBP% %DBN% -se "SELECT COUNT(*) FROM users" 2^>nul') do set "CNT=%%C"
echo   Usuarios tras seed: %CNT%
echo   Seed aplicado. Usuarios: %CNT% >> "%LOG%"
if "%CNT%"=="0" (
    echo   Seed no inserto usuarios. Verificando errores...
    echo   Intentando con SET FOREIGN_KEY_CHECKS=0 manual...
    "%MYSQL%" -uroot -p%DBR% %DBN% -e "SET FOREIGN_KEY_CHECKS=0; SET SESSION check_constraint_checks=OFF; INSERT IGNORE INTO users (id,tenant_id,empresa_id,tienda_id,nombre,email,password,rol,pin,activo,created_at,updated_at) VALUES (1,1,1,1,'Super Admin','admin@iados.mx','PLACEHOLDER','superadmin','0000',1,NOW(),NOW()), (2,1,1,1,'Administrador','admin2@iados.mx','PLACEHOLDER','admin','1111',1,NOW(),NOW()), (3,1,1,1,'Cajero Demo','cajero@iados.mx','PLACEHOLDER','cajero','1234',1,NOW(),NOW()); SET FOREIGN_KEY_CHECKS=1;" 2>&1
    for /f %%C in ('"%MYSQL%" -u%DBU% -p%DBP% %DBN% -se "SELECT COUNT(*) FROM users" 2^>nul') do set "CNT=%%C"
    echo   Usuarios tras insercion directa: %CNT%
    if "%CNT%"=="0" (
        echo   FALLO insercion directa. Revisa manualmente %D%\database\
        goto SKIP_DB
    )
)
echo   Seed/insercion OK.

:: Generar hashes bcrypt frescos y actualizar passwords
echo   Actualizando passwords con bcryptjs...
echo   Actualizando passwords... >> "%LOG%"
set "BPATH=C:/POS-iaDoS/backend/node_modules/bcryptjs"
echo try{const b=require('%BPATH%');const ha=b.hashSync('admin123',10);const hc=b.hashSync('cajero123',10);console.log(ha+'|'+hc);}catch(e){console.error(e.message);process.exit(1);} > "%TMP%"
for /f "delims=" %%O in ('"%NODE%" "%TMP%" 2^>nul') do set "HASHES=%%O"
if "%HASHES%"=="" (
    echo   ADVERTENCIA: no se pudo generar hashes frescos. Los del seed se mantienen.
    goto SKIP_BCRYPT
)
for /f "tokens=1 delims=|" %%A in ("%HASHES%") do set "HA=%%A"
for /f "tokens=2 delims=|" %%B in ("%HASHES%") do set "HC=%%B"
"%MYSQL%" -uroot -p%DBR% %DBN% -e "UPDATE users SET password='%HA%' WHERE rol IN ('superadmin','admin'); UPDATE users SET password='%HC%' WHERE rol IN ('cajero','mesero','manager');" 2>nul
echo   Passwords actualizados correctamente.
echo   Passwords actualizados >> "%LOG%"

:SKIP_BCRYPT
for /f %%H in ('"%MYSQL%" -u%DBU% -p%DBP% %DBN% -se "SELECT password FROM users WHERE id=1" 2^>nul') do set "HA=%%H"
for /f %%H in ('"%MYSQL%" -u%DBU% -p%DBP% %DBN% -se "SELECT password FROM users WHERE id=3" 2^>nul') do set "HC=%%H"
echo   Seed aplicado OK.
echo.
echo   Ahora intentando reiniciar el servicio Backend...
net session >nul 2>&1
if not errorlevel 1 (
    sc stop %SBE% >nul 2>&1
    timeout /t 3 /nobreak >nul
    sc start %SBE% >nul 2>&1
    timeout /t 5 /nobreak >nul
    echo   Servicio reiniciado. Espera 10s y abre http://localhost:3000
    echo   Backend reiniciado >> "%LOG%"
) else (
    echo   (Para reiniciar el servicio ejecuta como Administrador: sc start %SBE%)
)

:SKIP_DB

:: ----------------------------------------------------------------
:: 5. BCRYPT + API LOGIN
:: ----------------------------------------------------------------
echo.
echo [5] BCRYPT + API LOGIN
echo [5] BCRYPT + API >> "%LOG%"

if not exist "%NODE%" (
    echo   node.exe no encontrado: %NODE%
    echo   node.exe no encontrado >> "%LOG%"
    goto FIN
)

echo var b=require('%NM%/bcryptjs'); > "%TMP%"
echo var http=require('http'); >> "%TMP%"
echo console.log('--- BCRYPT ---'); >> "%TMP%"
echo console.log('admin123  admin :', b.compareSync('admin123', '%HA%') ? 'COINCIDE OK' : '!! FALLA !!'); >> "%TMP%"
echo console.log('cajero123 cajero:', b.compareSync('cajero123', '%HC%') ? 'COINCIDE OK' : '!! FALLA !!'); >> "%TMP%"
echo console.log('--- API LOGIN ---'); >> "%TMP%"
echo var bd=JSON.stringify({email:'admin@iados.mx',password:'admin123'}); >> "%TMP%"
echo var r=http.request({host:'localhost',port:3000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':bd.length}},function(res){ >> "%TMP%"
echo   var d=''; >> "%TMP%"
echo   res.on('data',function(c){d+=c;}); >> "%TMP%"
echo   res.on('end',function(){ >> "%TMP%"
echo     var ok=(res.statusCode===201); >> "%TMP%"
echo     console.log((ok?'LOGIN OK':'FALLO')+' HTTP '+res.statusCode+' admin@iados.mx'); >> "%TMP%"
echo     if(!ok) console.log('  Respuesta:',d.substring(0,300)); >> "%TMP%"
echo   }); >> "%TMP%"
echo }); >> "%TMP%"
echo r.on('error',function(e){console.log('ERROR conexion:',e.message);}); >> "%TMP%"
echo r.write(bd); >> "%TMP%"
echo r.end(); >> "%TMP%"

echo.
"%NODE%" "%TMP%"
"%NODE%" "%TMP%" >> "%LOG%" 2>&1

:FIN
echo.
echo ================================================================
echo   Log guardado: %LOG%
echo ================================================================
echo.
pause
endlocal
