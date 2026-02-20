# =============================================================================
# POS-iaDoS - Script de Instalación Principal
# Ejecutado por INSTALAR.bat con permisos de administrador
# =============================================================================
param(
    [string]$InstallerPath = (Split-Path -Parent $PSScriptRoot),
    [string]$InstallDir = "C:\POS-iaDoS",
    [int]$MariaDBPort = 3306,
    [int]$BackendPort = 3000
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

# =============================================================================
# PASO 1: Copiar archivos
# =============================================================================
Write-Log "Paso 1/8: Copiando archivos a $InstallDir..." "Yellow"

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallDir\logs" | Out-Null

# Copiar runtime
Write-Log "  Copiando Node.js..." "Gray"
Copy-Item -Path "$InstallerPath\runtime\node" -Destination "$InstallDir\node" -Recurse -Force

Write-Log "  Copiando MariaDB..." "Gray"
Copy-Item -Path "$InstallerPath\runtime\mariadb" -Destination "$InstallDir\mariadb" -Recurse -Force

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
# PASO 2: Configurar MariaDB
# =============================================================================
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

# =============================================================================
# PASO 5: Generar .env del backend
# =============================================================================
Write-Log "Paso 5/8: Configurando backend..." "Yellow"

# Generar JWT secret aleatorio
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

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
"@
$envContent | Set-Content "$InstallDir\backend\.env"

Write-Log "Backend configurado (.env generado)" "Green"

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

# Esperar que TypeORM termine de crear tablas
Write-Log "  Esperando a que las tablas se creen..." "Gray"
Start-Sleep -Seconds 5

Write-Log "Backend corriendo en puerto $BackendPort" "Green"

# =============================================================================
# PASO 7: Ejecutar seeds
# =============================================================================
Write-Log "Paso 7/8: Cargando datos iniciales..." "Yellow"

# Verificar si ya tiene datos (tabla tenants existe y tiene registros)
$ErrorActionPreference = "SilentlyContinue"
$checkResult = & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME -N -e "SELECT COUNT(*) FROM tenants;" 2>&1
$ErrorActionPreference = "Stop"
if ($checkResult -match "^0$" -or $checkResult -match "doesn't exist" -or $LASTEXITCODE -ne 0) {
    # Ejecutar seed
    $seedFile = "$InstallDir\database\03_seed_datos_iniciales.sql"
    if (Test-Path $seedFile) {
        Write-Log "  Ejecutando seeds..." "Gray"
        $ErrorActionPreference = "SilentlyContinue"
        Get-Content $seedFile -Raw | & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME 2>&1
        $ErrorActionPreference = "Stop"
        Write-Log "Datos iniciales cargados" "Green"
    } else {
        Write-Log "ADVERTENCIA: No se encontro archivo de seeds" "Yellow"
    }
} else {
    Write-Log "Base de datos ya tiene datos, saltando seeds" "Gray"
}

# =============================================================================
# PASO 8: Firewall
# =============================================================================
Write-Log "Paso 8/8: Configurando firewall..." "Yellow"

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
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   INSTALACION COMPLETADA!" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  URL:     http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  Usuario: admin@iados.mx" -ForegroundColor White
Write-Host "  Clave:   admin123" -ForegroundColor White
Write-Host "  PIN:     0000" -ForegroundColor White
Write-Host ""
Write-Host "  Carpeta: $InstallDir" -ForegroundColor Gray
Write-Host "  Logs:    $InstallDir\logs\" -ForegroundColor Gray
Write-Host ""
Write-Host "  Archivos de gestion en $InstallDir\:" -ForegroundColor Gray
Write-Host "    INICIAR.bat    - Iniciar servicios" -ForegroundColor Gray
Write-Host "    DETENER.bat    - Detener servicios" -ForegroundColor Gray
Write-Host "    ESTADO.bat     - Ver estado" -ForegroundColor Gray
Write-Host "    DESINSTALAR.bat - Desinstalar" -ForegroundColor Gray
Write-Host ""

# Abrir navegador
Start-Process "http://localhost:$BackendPort"
