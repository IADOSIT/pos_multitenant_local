# =============================================================================
# POS-iaDoS - Script de Instalación Principal
# Ejecutado por INSTALAR.bat con permisos de administrador
# =============================================================================
param(
    [string]$InstallerPath = (Split-Path -Parent $PSScriptRoot),
    [string]$InstallDir = "C:\POS-iaDoS",
    [int]$MariaDBPort = 3306,
    [int]$BackendPort = 3000,
    [string]$InstallDemoData = "0"
)

$ErrorActionPreference = "Stop"
$LOG_FILE = "$InstallDir\logs\install.log"
$DB_NAME = "pos_iados"
$DB_USER = "pos_iados"
$DB_PASS = "pos_iados_2024"
$DB_ROOT_PASS = "P0s_R00t_2024!"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMsg = "[$timestamp] $Message"
    Write-Host "  $Message" -ForegroundColor $Color
    if (Test-Path (Split-Path $LOG_FILE)) {
        Add-Content -Path $LOG_FILE -Value $logMsg
    }
}

function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSeconds = 60)
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("127.0.0.1", $Port)
            $tcp.Close()
            return $true
        } catch {
            Start-Sleep -Seconds 2
            $elapsed += 2
        }
    }
    return $false
}

# =============================================================================
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "   POS-iaDoS - Instalacion" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "  ERROR: Se requieren permisos de administrador" -ForegroundColor Red
    exit 1
}

# Verificar si ya esta instalado
if (Test-Path "$InstallDir\version.json") {
    $currentVer = (Get-Content "$InstallDir\version.json" | ConvertFrom-Json).version
    Write-Host "  POS-iaDoS v$currentVer ya esta instalado en $InstallDir" -ForegroundColor Yellow
    Write-Host "  Use ACTUALIZAR.bat para actualizar o DESINSTALAR.bat primero." -ForegroundColor Yellow
    exit 1
}

$InstallerPath = $InstallerPath.Trim('"').TrimEnd('\')

# Detectar modo de instalacion (local o online)
$InstallMode = "local"
$ModeFile = Join-Path $InstallerPath "install-mode.txt"
if (Test-Path $ModeFile) {
    $InstallMode = (Get-Content $ModeFile -Raw).Trim().ToLower()
}
Write-Log "Modo de instalacion: $InstallMode" "Cyan"

# Numero de pasos segun modo
$TotalPasos = if ($InstallMode -eq "local") { 8 } else { 6 }

# =============================================================================
# PASO 1: Copiar archivos
# =============================================================================
Write-Log "Paso 1/$TotalPasos`: Copiando archivos a $InstallDir..." "Yellow"

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallDir\logs" | Out-Null

# Copiar runtime
Write-Log "  Copiando Node.js..." "Gray"
Copy-Item -Path "$InstallerPath\runtime\node" -Destination "$InstallDir\node" -Recurse -Force

if ($InstallMode -eq "local") {
    Write-Log "  Copiando MariaDB..." "Gray"
    Copy-Item -Path "$InstallerPath\runtime\mariadb" -Destination "$InstallDir\mariadb" -Recurse -Force
}

Write-Log "  Copiando nssm..." "Gray"
New-Item -ItemType Directory -Force -Path "$InstallDir\tools" | Out-Null
Copy-Item -Path "$InstallerPath\runtime\nssm.exe" -Destination "$InstallDir\tools\nssm.exe" -Force

# Copiar app
Write-Log "  Copiando backend..." "Gray"
Copy-Item -Path "$InstallerPath\app\backend" -Destination "$InstallDir\backend" -Recurse -Force

Write-Log "  Copiando base de datos seeds..." "Gray"
Copy-Item -Path "$InstallerPath\app\database" -Destination "$InstallDir\database" -Recurse -Force

# Copiar scripts y version
Copy-Item -Path "$InstallerPath\setup\*.ps1" -Destination "$InstallDir\tools\" -Force
Copy-Item -Path "$InstallerPath\version.json" -Destination "$InstallDir\" -Force
Copy-Item -Path "$InstallerPath\DESINSTALAR.bat" -Destination "$InstallDir\" -Force

# Copiar BATs de gestion
@"
@echo off
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)
powershell -ExecutionPolicy Bypass -File "%~dp0tools\services.ps1" -Action start
pause
"@ | Set-Content "$InstallDir\INICIAR.bat"

@"
@echo off
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)
powershell -ExecutionPolicy Bypass -File "%~dp0tools\services.ps1" -Action stop
pause
"@ | Set-Content "$InstallDir\DETENER.bat"

@"
@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0tools\services.ps1" -Action status
pause
"@ | Set-Content "$InstallDir\ESTADO.bat"

Write-Log "Archivos copiados" "Green"

# =============================================================================
# PASO 2: Configurar MariaDB  (solo modo local)
# =============================================================================
if ($InstallMode -ne "local") {
    Write-Log "Modo online: omitiendo instalacion de MariaDB" "Cyan"
}
if ($InstallMode -eq "local") {
Write-Log "Paso 2/8: Configurando MariaDB..." "Yellow"

$MARIADB_DIR = "$InstallDir\mariadb"
$MARIADB_DATA = "$InstallDir\mariadb\data"
$MYSQLD = "$MARIADB_DIR\bin\mysqld.exe"
$MYSQL = "$MARIADB_DIR\bin\mysql.exe"

# Crear my.ini
$myIni = @"
[mysqld]
basedir=$($MARIADB_DIR -replace '\\','/')
datadir=$($MARIADB_DATA -replace '\\','/')
port=$MariaDBPort
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
innodb_buffer_pool_size=256M
max_connections=100
log_error=$($InstallDir -replace '\\','/')/logs/mariadb-error.log

[client]
port=$MariaDBPort
default-character-set=utf8mb4
"@
$myIni | Set-Content "$MARIADB_DIR\my.ini"

# Inicializar data directory
if (-not (Test-Path "$MARIADB_DATA\mysql")) {
    Write-Log "  Inicializando directorio de datos..." "Gray"
    $installDb = "$MARIADB_DIR\bin\mysql_install_db.exe"
    if (Test-Path $installDb) {
        $ErrorActionPreference = "SilentlyContinue"
        & $installDb --datadir="$MARIADB_DATA" --password="$DB_ROOT_PASS" 2>&1 | Out-Null
        $ErrorActionPreference = "Stop"
    } else {
        $ErrorActionPreference = "SilentlyContinue"
        & $MYSQLD --initialize-insecure --basedir="$MARIADB_DIR" --datadir="$MARIADB_DATA" 2>&1 | Out-Null
        $ErrorActionPreference = "Stop"
    }
}

Write-Log "MariaDB configurado" "Green"

# =============================================================================
# PASO 3: Instalar servicio MariaDB
# =============================================================================
Write-Log "Paso 3/8: Instalando servicio MariaDB..." "Yellow"

$NSSM = "$InstallDir\tools\nssm.exe"
$SVC_MARIADB = "PosIaDos-MariaDB"

# Remover si existe (ignorar error si el servicio no existe aun)
$ErrorActionPreference = "SilentlyContinue"
& $NSSM stop $SVC_MARIADB 2>&1 | Out-Null
& $NSSM remove $SVC_MARIADB confirm 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

& $NSSM install $SVC_MARIADB $MYSQLD "--defaults-file=$MARIADB_DIR\my.ini"
& $NSSM set $SVC_MARIADB DisplayName "POS-iaDoS MariaDB"
& $NSSM set $SVC_MARIADB Description "Servidor de base de datos MariaDB para POS-iaDoS"
& $NSSM set $SVC_MARIADB Start SERVICE_AUTO_START
& $NSSM set $SVC_MARIADB AppStdout "$InstallDir\logs\mariadb-stdout.log"
& $NSSM set $SVC_MARIADB AppStderr "$InstallDir\logs\mariadb-stderr.log"

# Iniciar MariaDB
Write-Log "  Iniciando MariaDB..." "Gray"
$ErrorActionPreference = "SilentlyContinue"
& $NSSM start $SVC_MARIADB 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

if (-not (Wait-ForPort -Port $MariaDBPort -TimeoutSeconds 30)) {
    Write-Log "ERROR: MariaDB no inicio en el puerto $MariaDBPort" "Red"
    exit 1
}
Write-Log "MariaDB corriendo en puerto $MariaDBPort" "Green"

# =============================================================================
# PASO 4: Crear base de datos y usuario
# =============================================================================
Write-Log "Paso 4/8: Creando base de datos..." "Yellow"

Start-Sleep -Seconds 3

# Detectar si root tiene password (usar LASTEXITCODE, no try/catch que falla con NativeCommandError)
$ErrorActionPreference = "SilentlyContinue"
& $MYSQL -u root --host=127.0.0.1 --port=$MariaDBPort -e "SELECT 1" 2>&1 | Out-Null
$rootNoPass = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = "Stop"

if ($rootNoPass) {
    # Root sin password: establecer password
    Write-Log "  Configurando password de root..." "Gray"
    $ErrorActionPreference = "SilentlyContinue"
    & $MYSQL -u root --host=127.0.0.1 --port=$MariaDBPort -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_ROOT_PASS'; FLUSH PRIVILEGES;" 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
}

# Verificar que root conecta con password conocido
$ErrorActionPreference = "SilentlyContinue"
& $MYSQL -u root -p"$DB_ROOT_PASS" --host=127.0.0.1 --port=$MariaDBPort -e "SELECT 1" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: No se pudo autenticar como root en MariaDB" "Red"
    $ErrorActionPreference = "Stop"
    exit 1
}
$ErrorActionPreference = "Stop"

$mysqlRoot = @("-u", "root", "-p$DB_ROOT_PASS", "--host=127.0.0.1", "--port=$MariaDBPort")

# Crear BD y usuario
$ErrorActionPreference = "SilentlyContinue"
& $MYSQL @mysqlRoot -e "CREATE DATABASE IF NOT EXISTS ``$DB_NAME`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1 | Out-Null
& $MYSQL @mysqlRoot -e "CREATE OR REPLACE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';" 2>&1 | Out-Null
& $MYSQL @mysqlRoot -e "CREATE OR REPLACE USER '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';" 2>&1 | Out-Null
& $MYSQL @mysqlRoot -e "GRANT ALL PRIVILEGES ON ``$DB_NAME``.* TO '$DB_USER'@'localhost';" 2>&1 | Out-Null
& $MYSQL @mysqlRoot -e "GRANT ALL PRIVILEGES ON ``$DB_NAME``.* TO '$DB_USER'@'127.0.0.1';" 2>&1 | Out-Null
& $MYSQL @mysqlRoot -e "FLUSH PRIVILEGES;" 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

# Verificar que el usuario de la app conecta correctamente
$ErrorActionPreference = "SilentlyContinue"
& $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort -e "SELECT 1" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: No se pudo autenticar usuario '$DB_USER' en MariaDB" "Red"
    $ErrorActionPreference = "Stop"
    exit 1
}
$ErrorActionPreference = "Stop"

Write-Log "Base de datos '$DB_NAME' creada" "Green"

} # fin bloque local (MariaDB)

# =============================================================================
# PASO 5: Generar .env del backend
# =============================================================================
Write-Log "Paso 5/$TotalPasos`: Configurando backend..." "Yellow"

# Generar JWT secret aleatorio
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

if ($InstallMode -eq "online") {
    # Modo online: usar el template de ext.env como base y agregar/sobreescribir valores necesarios
    $templateFile = Join-Path $InstallerPath "backend.env.template"
    if (Test-Path $templateFile) {
        $envContent = Get-Content $templateFile -Raw
        # Forzar produccion y actualizar JWT con uno generado
        $envContent = $envContent -replace 'NODE_ENV=.*', 'NODE_ENV=production'
        $envContent = $envContent -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwtSecret"
        $envContent = $envContent -replace 'APP_PORT=.*', "APP_PORT=$BackendPort"
        $envContent = $envContent -replace 'APP_HOST=.*', 'APP_HOST=0.0.0.0'
        $envContent += "`nINSTALL_MODE=online"
        $envContent | Set-Content "$InstallDir\backend\.env" -Encoding UTF8
        Write-Log "  .env generado desde template online" "Gray"
    } else {
        Write-Log "ERROR: No se encontro backend.env.template para modo online" "Red"
        exit 1
    }
} else {

$envContent = @"
NODE_ENV=production
APP_PORT=$BackendPort
APP_HOST=0.0.0.0
DB_HOST=127.0.0.1
DB_PORT=$MariaDBPort
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASS
DB_DATABASE=$DB_NAME
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:$BackendPort
INSTALL_MODE=local
"@
$envContent | Set-Content "$InstallDir\backend\.env"
Write-Log "Backend configurado (.env generado)" "Green"

} # fin bloque local (.env)

# =============================================================================
# PASO 6: Instalar servicio Backend
# =============================================================================
Write-Log "Paso 6/8: Instalando servicio Backend..." "Yellow"

$SVC_BACKEND = "PosIaDos-Backend"
$NODE_EXE = "$InstallDir\node\node.exe"

# Remover si existe (ignorar error si el servicio no existe aun)
$ErrorActionPreference = "SilentlyContinue"
& $NSSM stop $SVC_BACKEND 2>&1 | Out-Null
& $NSSM remove $SVC_BACKEND confirm 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

& $NSSM install $SVC_BACKEND $NODE_EXE "dist\main.js"
& $NSSM set $SVC_BACKEND DisplayName "POS-iaDoS Backend"
& $NSSM set $SVC_BACKEND Description "Servidor API y Frontend para POS-iaDoS"
& $NSSM set $SVC_BACKEND AppDirectory "$InstallDir\backend"
& $NSSM set $SVC_BACKEND Start SERVICE_AUTO_START
& $NSSM set $SVC_BACKEND AppStdout "$InstallDir\logs\backend-stdout.log"
& $NSSM set $SVC_BACKEND AppStderr "$InstallDir\logs\backend-stderr.log"
& $NSSM set $SVC_BACKEND AppEnvironmentExtra "NODE_ENV=production"

# Iniciar backend
Write-Log "  Iniciando Backend (TypeORM creara las tablas automaticamente)..." "Gray"
$ErrorActionPreference = "SilentlyContinue"
& $NSSM start $SVC_BACKEND 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

if (-not (Wait-ForPort -Port $BackendPort -TimeoutSeconds 60)) {
    Write-Log "ERROR: Backend no inicio en el puerto $BackendPort" "Red"
    Write-Log "Revise logs en $InstallDir\logs\" "Red"
    exit 1
}

# Esperar que TypeORM termine de sincronizar TODAS las tablas (max 2 min)
Write-Log "  Esperando a que TypeORM sincronice tablas (max 120s)..." "Gray"
$tableReady = $false
for ($i = 0; $i -lt 24; $i++) {
    $ErrorActionPreference = "SilentlyContinue"
    & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME -N -e "SELECT 1 FROM users LIMIT 1" 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -eq 0) {
        $tableReady = $true
        Write-Log "  Tablas listas (${i}x5s)" "Gray"
        break
    }
    Start-Sleep -Seconds 5
}
if (-not $tableReady) {
    Write-Log "ADVERTENCIA: TypeORM tardo mas de 2 minutos. Continuando de todos modos..." "Yellow"
}

Write-Log "Backend corriendo en puerto $BackendPort" "Green"

# =============================================================================
# PASO 7: Ejecutar seeds (solo modo local)
# =============================================================================
if ($InstallMode -eq "local") {
    Write-Log "Paso 7/$TotalPasos`: Cargando datos iniciales..." "Yellow"
    $ErrorActionPreference = "SilentlyContinue"
    $checkResult = & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME -N -e "SELECT COUNT(*) FROM tenants;" 2>&1
    $ErrorActionPreference = "Stop"
    if ($checkResult -match "^0$" -or $checkResult -match "doesn't exist" -or $LASTEXITCODE -ne 0) {
        $seedFile = "$InstallDir\database\03_seed_datos_iniciales.sql"
        if (Test-Path $seedFile) {
            Write-Log "  Ejecutando seeds..." "Gray"
            $ErrorActionPreference = "SilentlyContinue"
            $seedOutput = Get-Content $seedFile -Raw | & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME 2>&1
            $seedExit = $LASTEXITCODE
            $ErrorActionPreference = "Stop"
            if ($seedExit -ne 0 -or ($seedOutput -match "ERROR 1")) {
                Write-Log "ADVERTENCIA seed: $seedOutput" "Yellow"
            } else {
                Write-Log "Datos iniciales cargados" "Green"
            }

            # Generar hashes reales con el Node.js instalado para garantizar credenciales correctas
            Write-Log "  Actualizando passwords con bcryptjs..." "Gray"
            # Usar ruta absoluta para require (el CWD de Node al lanzarse puede no ser backend/)
            $bcryptPath = "$InstallDir\backend\node_modules\bcryptjs" -replace '\\', '\\\\'
            $hashScript = "try{const b=require('$bcryptPath');console.log(b.hashSync('admin123',10)+'|'+b.hashSync('cajero123',10));}catch(e){process.exit(1);}"
            $ErrorActionPreference = "SilentlyContinue"
            $hashOut = & "$InstallDir\node\node.exe" -e $hashScript 2>&1
            $ErrorActionPreference = "Stop"
            if ($hashOut -match '^\$2[ab]\$') {
                $parts      = $hashOut -split '\|'
                $hashAdmin  = $parts[0].Trim()
                $hashCajero = $parts[1].Trim()
                $updateSql  = "UPDATE users SET password='$hashAdmin'  WHERE rol IN ('superadmin','admin');" +
                              "UPDATE users SET password='$hashCajero' WHERE rol IN ('cajero','mesero','manager');"
                $ErrorActionPreference = "SilentlyContinue"
                & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME -e $updateSql 2>&1 | Out-Null
                $ErrorActionPreference = "Stop"
                Write-Log "  Passwords generados y aplicados correctamente" "Green"
            } else {
                Write-Log "ADVERTENCIA: No se pudieron generar hashes frescos. Usando los del seed." "Yellow"
            }
        } else {
            Write-Log "ADVERTENCIA: No se encontro archivo de seeds" "Yellow"
        }

        # --- Seeds de prueba (parametro desde Inno Setup wizard) ---
        if ($InstallDemoData -eq "1") {
            $seedPruebas = "$InstallDir\database\04_seed_pruebas.sql"
            if (Test-Path $seedPruebas) {
                Write-Log "  Instalando datos de prueba..." "Gray"
                $ErrorActionPreference = "SilentlyContinue"
                Get-Content $seedPruebas -Raw | & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME 2>&1 | Out-Null
                $ErrorActionPreference = "Stop"
                Write-Log "Datos de prueba instalados" "Green"
            }
        }
    } else {
        Write-Log "Base de datos ya tiene datos, saltando seeds" "Gray"
    }
} else {
    Write-Log "Modo online: seeds omitidos (BD en nube ya tiene datos)" "Cyan"
}

# =============================================================================
# PASO 8 (local) / PASO 6 (online): Firewall
# =============================================================================
Write-Log "Paso $TotalPasos/$TotalPasos`: Configurando firewall..." "Yellow"

# Remover reglas existentes (ignorar si no existen)
$ErrorActionPreference = "SilentlyContinue"
netsh advfirewall firewall delete rule name="POS-iaDoS Backend" 2>&1 | Out-Null
netsh advfirewall firewall delete rule name="POS-iaDoS MariaDB" 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

# Agregar nuevas reglas
netsh advfirewall firewall add rule name="POS-iaDoS Backend" dir=in action=allow protocol=tcp localport=$BackendPort | Out-Null
netsh advfirewall firewall add rule name="POS-iaDoS MariaDB" dir=in action=allow protocol=tcp localport=$MariaDBPort | Out-Null

Write-Log "Firewall configurado" "Green"

# =============================================================================
# Finalizado
# =============================================================================
Write-Host ""
# Obtener nombre e IP del servidor para mostrar a otros equipos
$ServerHostname = $env:COMPUTERNAME
$ServerIP = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } |
    Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $ServerIP) { $ServerIP = "VER-IP-DEL-SERVIDOR" }

Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   INSTALACION COMPLETADA!" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Modo: $InstallMode" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ACCESO DESDE ESTE EQUIPO:" -ForegroundColor White
Write-Host "    http://localhost:$BackendPort" -ForegroundColor Green
Write-Host ""
Write-Host "  ACCESO DESDE OTROS EQUIPOS EN LA RED:" -ForegroundColor White
Write-Host "    Por nombre:  http://$ServerHostname`:$BackendPort" -ForegroundColor Yellow
Write-Host "    Por IP:      http://$ServerIP`:$BackendPort" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Credenciales iniciales:" -ForegroundColor White
Write-Host "    Usuario: admin@iados.mx" -ForegroundColor Gray
Write-Host "    Clave:   admin123    PIN: 0000" -ForegroundColor Gray
Write-Host ""
Write-Host "  Carpeta: $InstallDir" -ForegroundColor Gray
Write-Host "  Logs:    $InstallDir\logs\" -ForegroundColor Gray
Write-Host ""
Write-Host "  Gestion de servicios:" -ForegroundColor Gray
Write-Host "    INICIAR.bat | DETENER.bat | ESTADO.bat | DESINSTALAR.bat" -ForegroundColor Gray
Write-Host ""

# Abrir navegador
Start-Process "http://localhost:$BackendPort"
