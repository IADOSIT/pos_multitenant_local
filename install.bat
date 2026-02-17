@echo off
setlocal enabledelayedexpansion
REM ============================================
REM POS-iaDoS - INSTALADOR 1-CLICK (Docker)
REM iaDoS - iados.mx
REM ============================================

cls
echo ============================================
echo   POS-iaDoS - Instalador 1-Click
echo   iaDoS - iados.mx
echo ============================================
echo.

REM 1. Verificar Docker
echo [1/6] Verificando Docker...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado.
    echo Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
docker --version
echo   OK

REM 2. Verificar que Docker esta corriendo
echo [2/6] Verificando Docker daemon...
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta corriendo. Inicia Docker Desktop.
    pause
    exit /b 1
)
echo   OK Docker activo

REM 3. Verificar Docker Compose
echo [3/6] Verificando Docker Compose...
docker compose version >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose no encontrado.
    pause
    exit /b 1
)
echo   OK

REM 4. Detener contenedores previos
echo [4/6] Preparando...
docker compose down >nul 2>nul
echo   OK

REM 5. Build y arranque
echo.
echo [5/6] Construyendo e iniciando servicios...
echo   Esto puede tardar 2-5 minutos la primera vez...
echo.
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al construir los contenedores.
    echo Revisa que no haya errores arriba.
    pause
    exit /b 1
)

REM 6. Esperar servicios
echo.
echo [6/6] Esperando que los servicios esten listos...

echo   Esperando MySQL...
set RETRIES=0
:wait_mysql
set /a RETRIES+=1
if !RETRIES! gtr 40 (
    echo   [WARN] MySQL tardo mas de lo esperado
    goto mysql_done
)
docker exec pos-iados-db mysqladmin ping -h localhost -u pos_iados -ppos_iados_2024 >nul 2>nul
if %errorlevel% neq 0 (
    timeout /t 3 /nobreak >nul
    goto wait_mysql
)
echo   MySQL: OK
:mysql_done

echo   Esperando Backend...
set RETRIES=0
:wait_backend
set /a RETRIES+=1
if !RETRIES! gtr 30 (
    echo   [WARN] Backend tardo mas de lo esperado
    goto backend_done
)
curl -sf http://localhost:3000/api/health >nul 2>nul
if %errorlevel% neq 0 (
    timeout /t 3 /nobreak >nul
    goto wait_backend
)
echo   Backend: OK
:backend_done

echo   Esperando Frontend...
set RETRIES=0
:wait_frontend
set /a RETRIES+=1
if !RETRIES! gtr 20 (
    echo   [WARN] Frontend tardo mas de lo esperado
    goto frontend_done
)
curl -sf http://localhost/ >nul 2>nul
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_frontend
)
echo   Frontend: OK
:frontend_done

REM ---- PRUEBAS BD ----
echo.
echo ============================================
echo   PRUEBAS DE BASE DE DATOS MySQL
echo ============================================
echo.

set PASS=0
set FAIL=0

REM Test conexion
docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 -e "SELECT 1;" pos_iados >nul 2>nul
if %errorlevel% equ 0 (
    echo   PASS Conexion MySQL
    set /a PASS+=1
) else (
    echo   FAIL Conexion MySQL
    set /a FAIL+=1
)

REM Test tablas
for %%T in (tenants empresas tiendas users categorias productos producto_tienda cajas movimientos_caja ventas venta_detalles venta_pagos ticket_configs auditoria) do (
    docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT 1 FROM %%T LIMIT 1;" >nul 2>nul
    if !errorlevel! equ 0 (
        echo   PASS Tabla %%T
        set /a PASS+=1
    ) else (
        echo   FAIL Tabla %%T
        set /a FAIL+=1
    )
)

REM Test seeds con conteos
for /f "tokens=*" %%C in ('docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT COUNT(*) FROM users;" 2^>nul') do set USER_COUNT=%%C
echo   INFO Usuarios: %USER_COUNT%

for /f "tokens=*" %%C in ('docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT COUNT(*) FROM productos;" 2^>nul') do set PROD_COUNT=%%C
echo   INFO Productos: %PROD_COUNT%

for /f "tokens=*" %%C in ('docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT COUNT(*) FROM categorias;" 2^>nul') do set CAT_COUNT=%%C
echo   INFO Categorias: %CAT_COUNT%

REM Test charset
for /f "tokens=*" %%C in ('docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT DEFAULT_CHARACTER_SET_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='pos_iados';" 2^>nul') do set CHARSET=%%C
if "%CHARSET%"=="utf8mb4" (
    echo   PASS Charset utf8mb4
    set /a PASS+=1
) else (
    echo   FAIL Charset: %CHARSET%
    set /a FAIL+=1
)

REM Test API login
echo.
echo   PRUEBAS API
curl -sf -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@iados.mx\",\"password\":\"admin123\"}" >nul 2>nul
if %errorlevel% equ 0 (
    echo   PASS Login SuperAdmin via API
    set /a PASS+=1
) else (
    echo   FAIL Login SuperAdmin via API
    set /a FAIL+=1
)

REM Test health
curl -sf http://localhost:3000/api/health >nul 2>nul
if %errorlevel% equ 0 (
    echo   PASS API Health endpoint
    set /a PASS+=1
) else (
    echo   FAIL API Health endpoint
    set /a FAIL+=1
)

echo.
set /a TOTAL=PASS+FAIL
echo --------------------------------------------
echo   Tests: %PASS% PASS / %FAIL% FAIL / %TOTAL% total
echo --------------------------------------------

REM ---- RESULTADO ----
echo.
echo ============================================
if %FAIL% equ 0 (
    echo   POS-iaDoS INSTALADO CORRECTAMENTE
) else (
    echo   POS-iaDoS INSTALADO (con advertencias)
)
echo ============================================
echo.
echo   Abrir POS:       http://localhost
echo   Kiosco:          http://localhost/kiosco
echo   API Health:      http://localhost:3000/api/health
echo   MySQL:           localhost:3307
echo.
echo   Credenciales:
echo     SuperAdmin:  admin@iados.mx / admin123
echo     Admin:       admin2@iados.mx / admin123
echo     Cajero:      cajero@iados.mx / cajero123 (PIN: 1234)
echo     Mesero:      mesero@iados.mx / cajero123 (PIN: 5678)
echo.
echo   Comandos:
echo     Parar:   docker compose down
echo     Iniciar: docker compose up -d
echo     Logs:    docker compose logs -f
echo     Reset:   docker compose down -v ^&^& docker compose up -d --build
echo.
echo   POS-iaDoS by iaDoS - iados.mx
echo ============================================
echo.
pause
