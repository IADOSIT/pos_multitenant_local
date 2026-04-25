# =============================================================================
# POS-iaDoS - Script de Instalación Principal
# Ejecutado por INSTALAR.bat con permisos de administrador
# =============================================================================
param(
    [string]$InstallerPath = (Split-Path -Parent $PSScriptRoot),
    [string]$InstallDir = "C:\POS-iaDoS",
    [int]$MariaDBPort = 3306,
    [int]$BackendPort = 3000,
    [string]$InstallDemoData = "0",
    [string]$AdminEmail = "",
    [string]$NombreNegocio = ""
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

# Leer version del paquete
$AppVersion = ""
$versionFile = Join-Path $InstallerPath "version.json"
if (Test-Path $versionFile) {
    $AppVersion = (Get-Content $versionFile -Raw | ConvertFrom-Json).version
}

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
# Preservar uploads del cliente si ya existen (logos subidos en instalaciones previas)
$existingUploads = "$InstallDir\backend\uploads"
$hasExistingUploads = Test-Path $existingUploads
if ($hasExistingUploads) {
    $uploadsBackup = "$InstallDir\backend\_uploads_bak_$(Get-Date -Format 'yyyyMMddHHmm')"
    Copy-Item -Path $existingUploads -Destination $uploadsBackup -Recurse -Force
    Write-Log "  Uploads previos respaldados en: $uploadsBackup" "Gray"
}
Copy-Item -Path "$InstallerPath\app\backend" -Destination "$InstallDir\backend" -Recurse -Force
# Restaurar uploads del cliente (sus logos tienen prioridad sobre los del instalador)
if ($hasExistingUploads) {
    Copy-Item -Path "$uploadsBackup\*" -Destination "$InstallDir\backend\uploads" -Recurse -Force
    Remove-Item -Path $uploadsBackup -Recurse -Force
    Write-Log "  Uploads del cliente restaurados" "Gray"
}

Write-Log "  Copiando base de datos seeds..." "Gray"
Copy-Item -Path "$InstallerPath\app\database" -Destination "$InstallDir\database" -Recurse -Force

# Copiar scripts y version
Copy-Item -Path "$InstallerPath\setup\*.ps1" -Destination "$InstallDir\tools\" -Force
Copy-Item -Path "$InstallerPath\version.json" -Destination "$InstallDir\" -Force
Copy-Item -Path "$InstallerPath\DESINSTALAR.bat"   -Destination "$InstallDir\" -Force
if (Test-Path "$InstallerPath\DIAGNOSTICO.bat") {
    Copy-Item -Path "$InstallerPath\DIAGNOSTICO.bat" -Destination "$InstallDir\" -Force
}

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

# Crear tablas con el orden de columnas correcto (sincronizado con seeds VPS)
# IMPORTANTE: debe ejecutarse ANTES que el backend para que TypeORM no altere el orden
$schemaFile = "$InstallDir\database\02_crear_tablas.sql"
if (Test-Path $schemaFile) {
    Write-Log "  Creando estructura de tablas..." "Gray"
    $ErrorActionPreference = "SilentlyContinue"
    $schemaOut = Get-Content $schemaFile -Raw | & $MYSQL -f -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME 2>&1
    $ErrorActionPreference = "Stop"
    Write-Log "  Estructura de tablas creada" "Green"
} else {
    Write-Log "ADVERTENCIA: No se encontro 02_crear_tablas.sql" "Yellow"
}

# -----------------------------------------------------------------------
# SEEDS ANTES DEL BACKEND: tablas ya existen con orden VPS correcto.
# TypeORM solo agrega columnas faltantes AL FINAL (no toca datos existentes).
# -----------------------------------------------------------------------
Write-Log "  Cargando datos iniciales (ANTES del backend)..." "Gray"

$seedFile03 = "$InstallDir\database\03_seed_datos_iniciales.sql"
if (Test-Path $seedFile03) {
    $ErrorActionPreference = "SilentlyContinue"
    $s03out = Get-Content $seedFile03 -Raw | & $MYSQL -f -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME 2>&1
    $s03exit = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    if ($s03exit -ne 0 -or ("$s03out" -match "ERROR 1[^0289]")) {
        Write-Log "  ADVERTENCIA seed 03: $s03out" "Yellow"
    } else {
        Write-Log "  03_seed ejecutado OK" "Green"
    }
} else {
    Write-Log "  ADVERTENCIA: No se encontro 03_seed_datos_iniciales.sql" "Yellow"
}

$seedFile04 = "$InstallDir\database\04_seed_pruebas.sql"
if (Test-Path $seedFile04) {
    $ErrorActionPreference = "SilentlyContinue"
    Get-Content $seedFile04 -Raw | & $MYSQL -f -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    Write-Log "  04_seed ejecutado OK" "Green"
} else {
    Write-Log "  ADVERTENCIA: No se encontro 04_seed_pruebas.sql" "Yellow"
}

# 05 - Perfil Carbon+Hielo (columnas modulo + tablas de perfiles)
$seedFile05 = "$InstallDir\database\05_perfil_carbon_hielo.sql"
if (Test-Path $seedFile05) {
    $ErrorActionPreference = "SilentlyContinue"
    Get-Content $seedFile05 -Raw | & $MYSQL -f -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    Write-Log "  05_seed ejecutado OK" "Green"
}

# Generar hashes frescos con bcryptjs (Node ya fue copiado en PASO 1)
Write-Log "  Actualizando passwords con bcryptjs..." "Gray"
$bcryptPath2 = "$InstallDir\backend\node_modules\bcryptjs" -replace '\\', '\\\\'
$hashScript2  = "try{const b=require('$bcryptPath2');console.log(b.hashSync('admin123',10)+'|'+b.hashSync('cajero123',10));}catch(e){process.exit(1);}"
$ErrorActionPreference = "SilentlyContinue"
$hashOut2 = & "$InstallDir\node\node.exe" -e $hashScript2 2>&1
$ErrorActionPreference = "Stop"
if ($hashOut2 -match '^\$2[ab]\$') {
    $hparts     = $hashOut2 -split '\|'
    $hAdmin     = $hparts[0].Trim()
    $hCajero    = $hparts[1].Trim()
    $updSql     = "UPDATE users SET password='$hAdmin'  WHERE rol IN ('superadmin','admin');" +
                  "UPDATE users SET password='$hCajero' WHERE rol IN ('cajero','mesero','manager');"
    $ErrorActionPreference = "SilentlyContinue"
    & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME -e $updSql 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    Write-Log "  Passwords bcryptjs aplicados" "Green"
} else {
    Write-Log "  ADVERTENCIA: No se pudo generar hash bcryptjs. Usando hash del seed." "Yellow"
}

Write-Log "Datos iniciales listos antes del arranque del backend" "Green"

# =============================================================================
# ALTA DEL CLIENTE — Tenant, usuarios Admin/Cajero/Mesero personalizados
# Se ejecuta solo si el instalador paso AdminEmail (via wizard Inno Setup)
# =============================================================================
$adminEmailTrim = $AdminEmail.Trim()
$nombreNegTrim  = $NombreNegocio.Trim()

if ($adminEmailTrim -ne "" -and $adminEmailTrim.Contains("@")) {
    Write-Log "Creando acceso personalizado para: $adminEmailTrim" "Yellow"

    # Si no se dio nombre de negocio, derivar del dominio del email
    if ($nombreNegTrim -eq "") {
        $dominioRaw = $adminEmailTrim.Split("@")[1]
        $nombreNegTrim = (Get-Culture).TextInfo.ToTitleCase($dominioRaw.Split(".")[0])
    }

    # Generar hashes frescos con bcryptjs (admin123, cajero123, mesero123)
    $bcryptPathC = "$InstallDir\backend\node_modules\bcryptjs" -replace '\\', '\\\\'
    $hashScriptC = "try{const b=require('$bcryptPathC');const a=b.hashSync('admin123',10);const c=b.hashSync('cajero123',10);const m=b.hashSync('mesero123',10);console.log(a+'|'+c+'|'+m);}catch(e){process.exit(1);}"
    $ErrorActionPreference = "SilentlyContinue"
    $hashOutC = & "$InstallDir\node\node.exe" -e $hashScriptC 2>&1
    $ErrorActionPreference = "Stop"

    if ($hashOutC -match '^\$2[ab]\$') {
        $hPartsC     = $hashOutC -split '\|'
        $hAdminC     = $hPartsC[0].Trim()
        $hCajeroC    = $hPartsC[1].Trim()
        $hMeseroC    = $hPartsC[2].Trim()

        # Derivar emails de cajero y mesero
        $atIdx       = $adminEmailTrim.IndexOf('@')
        $dominio     = $adminEmailTrim.Substring($atIdx + 1)
        $emailCajero = "cajero@$dominio"
        $emailMesero = "mesero@$dominio"

        # Slug del negocio (ASCII, sin tildes, solo a-z0-9-)
        $slugNeg = $nombreNegTrim.ToLowerInvariant()
        $slugNeg = [System.Text.RegularExpressions.Regex]::Replace($slugNeg, '[áàäâ]', 'a')
        $slugNeg = [System.Text.RegularExpressions.Regex]::Replace($slugNeg, '[éèëê]', 'e')
        $slugNeg = [System.Text.RegularExpressions.Regex]::Replace($slugNeg, '[íìïî]', 'i')
        $slugNeg = [System.Text.RegularExpressions.Regex]::Replace($slugNeg, '[óòöô]', 'o')
        $slugNeg = [System.Text.RegularExpressions.Regex]::Replace($slugNeg, '[úùüû]', 'u')
        $slugNeg = [System.Text.RegularExpressions.Regex]::Replace($slugNeg, 'ñ', 'n')
        $slugNeg = [System.Text.RegularExpressions.Regex]::Replace($slugNeg, '[^a-z0-9]+', '-')
        $slugNeg = $slugNeg.Trim('-')
        $slugSuffix = (Get-Date -Format "yyMMdd")

        # Codigo de licencia
        $licCodigo = "INS-" + ([System.Guid]::NewGuid().ToString("N").Substring(0, 8).ToUpper())
        $hoy       = (Get-Date -Format "yyyy-MM-dd")

        # Escapar comillas simples para SQL
        $eEmail   = $adminEmailTrim -replace "'", "''"
        $eNombre  = $nombreNegTrim  -replace "'", "''"
        $eCajero  = $emailCajero    -replace "'", "''"
        $eMesero  = $emailMesero    -replace "'", "''"
        $eHAdmin  = $hAdminC        -replace "'", "''"
        $eHCajero = $hCajeroC       -replace "'", "''"
        $eHMesero = $hMeseroC       -replace "'", "''"
        $eSlug    = "$slugNeg-$slugSuffix"
        $eLic     = $licCodigo      -replace "'", "''"

        # Bloque TRUNCATE solo si no se pidieron datos demo
        $truncateBlock = ""
        if ($InstallDemoData -ne "1") {
            $truncateBlock = @"

-- Limpiar datos demo antes de insertar datos reales del cliente
TRUNCATE TABLE ``ticket_configs``;
TRUNCATE TABLE ``licencias``;
TRUNCATE TABLE ``users``;
TRUNCATE TABLE ``tiendas``;
TRUNCATE TABLE ``empresas``;
TRUNCATE TABLE ``tenants``;
ALTER TABLE ``tenants``  AUTO_INCREMENT = 1;
ALTER TABLE ``empresas`` AUTO_INCREMENT = 1;
ALTER TABLE ``tiendas``  AUTO_INCREMENT = 1;
ALTER TABLE ``users``    AUTO_INCREMENT = 1;
ALTER TABLE ``licencias`` AUTO_INCREMENT = 1;
"@
        }

        $clientSql = @"
SET FOREIGN_KEY_CHECKS=0;
SET SESSION check_constraint_checks=OFF;
SET NAMES utf8mb4;
$truncateBlock

INSERT INTO ``tenants`` (nombre, slug, activo, created_at, updated_at)
  VALUES ('$eNombre', '$eSlug', 1, NOW(), NOW());
SET @t = LAST_INSERT_ID();

INSERT INTO ``empresas`` (tenant_id, nombre, activo, created_at, updated_at)
  VALUES (@t, '$eNombre', 1, NOW(), NOW());
SET @e = LAST_INSERT_ID();

INSERT INTO ``tiendas`` (tenant_id, empresa_id, nombre, zona_horaria, activo, created_at, updated_at,
  config_pos, slug, folio_venta_counter, folio_pedido_counter)
  VALUES (@t, @e, '$eNombre', 'America/Mexico_City', 1, NOW(), NOW(),
  '{"iva_enabled":false,"iva_incluido":true,"iva_porcentaje":16,"modo_servicio":"mostrador","num_mesas":0,"self_order_enabled":false}',
  CONCAT('$eSlug-', FLOOR(RAND()*9000+1000)), 0, 0);
SET @s = LAST_INSERT_ID();

INSERT INTO ``licencias`` (tenant_id, codigo_instalacion, plan, features, max_tiendas, max_usuarios,
  fecha_inicio, fecha_fin, grace_days, offline_allowed, estado, created_at, updated_at)
  VALUES (@t, '$eLic', 'pro', '["pos","caja","pedidos","reportes","dashboard"]',
  5, 20, '$hoy', DATE_ADD('$hoy', INTERVAL 30 DAY), 30, 1, 'trial', NOW(), NOW());

INSERT INTO ``users`` (tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo, created_at, updated_at)
  VALUES (@t, @e, @s, 'Administrador', '$eEmail', '$eHAdmin', 'admin', '0000', 1, NOW(), NOW());

INSERT INTO ``users`` (tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo, created_at, updated_at)
  VALUES (@t, @e, @s, CONCAT('Cajero ', '$eNombre'), '$eCajero', '$eHCajero', 'cajero', '1234', 1, NOW(), NOW());

INSERT INTO ``users`` (tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo, created_at, updated_at)
  VALUES (@t, @e, @s, CONCAT('Mesero ', '$eNombre'), '$eMesero', '$eHMesero', 'mesero', '5678', 1, NOW(), NOW());

INSERT INTO ``ticket_configs`` (tenant_id, empresa_id, tienda_id,
  encabezado_linea1, encabezado_linea2,
  pie_linea1, pie_linea2,
  ancho_papel, columnas,
  mostrar_logo, mostrar_fecha, mostrar_cajero, mostrar_folio, mostrar_marca_iados,
  fuente_familia, fuente_tamano, logo_posicion,
  copias, comanda_enabled, comanda_ancho, comanda_auto_print, comanda_mostrar_precio, comanda_copias,
  created_at, updated_at)
  VALUES (@t, @e, @s,
  '$eNombre', '',
  'Gracias por su preferencia!', 'Punto de Venta iaDoS',
  80, 42,
  1, 1, 1, 1, 0,
  'Consolas', 11, 'centro',
  1, 0, 80, 0, 1, 1,
  NOW(), NOW());

-- admin@iados.mx siempre debe existir como superadmin
-- UPDATE si ya existe (refresca hash), INSERT si no existe
UPDATE ``users`` SET password='$eHAdmin', rol='superadmin', pin='0000', activo=1, updated_at=NOW()
  WHERE email='admin@iados.mx';
INSERT INTO ``users`` (tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo, created_at, updated_at)
  SELECT @t, @e, @s, 'Super Admin iaDoS', 'admin@iados.mx', '$eHAdmin', 'superadmin', '0000', 1, NOW(), NOW()
  FROM DUAL WHERE (SELECT COUNT(*) FROM ``users`` WHERE email='admin@iados.mx') = 0;

SET FOREIGN_KEY_CHECKS=1;
"@

        $ErrorActionPreference = "SilentlyContinue"
        $clientSqlOut = $clientSql | & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME 2>&1
        $clientSqlExit = $LASTEXITCODE
        $ErrorActionPreference = "Stop"

        if ($clientSqlExit -ne 0 -or ("$clientSqlOut" -match "ERROR [0-9]")) {
            Write-Log "  ERROR en alta cliente: $clientSqlOut" "Red"
        } else {
            Write-Log "  Tenant '$nombreNegTrim' creado (licencia permanente)" "Green"
        Write-Log "  Admin:  $adminEmailTrim  /  admin123  /  PIN 0000" "Green"
        Write-Log "  Cajero: $emailCajero  /  cajero123  /  PIN 1234" "Green"
        Write-Log "  Mesero: $emailMesero  /  mesero123  /  PIN 5678" "Green"

        # Guardar CREDENCIALES.txt en la carpeta de instalacion
        New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
        @"
POS-iaDoS - Credenciales de Acceso
====================================
Negocio  : $nombreNegTrim
Licencia : Permanente ($licCodigo)
Fecha    : $(Get-Date -Format 'dd/MM/yyyy HH:mm')

URL de acceso desde este equipo:
  http://localhost:$BackendPort

URL desde otros equipos en la misma red:
  http://<IP-DEL-SERVIDOR>:$BackendPort

ADMINISTRADOR
  Email      : $adminEmailTrim
  Contraseña : admin123
  PIN        : 0000

CAJERO (creado automáticamente)
  Email      : $emailCajero
  Contraseña : cajero123
  PIN        : 1234

MESERO (creado automáticamente)
  Email      : $emailMesero
  Contraseña : mesero123
  PIN        : 5678

PRIMER USO
----------
1. Abre http://localhost:$BackendPort e inicia sesion como Administrador
2. Configuracion > Ticket : nombre, direccion y telefono del negocio
3. Configuracion > POS    : modo de servicio (mostrador / mesa)
4. Productos              : crea categorias y productos
5. Caja                   : abre tu primera sesion de caja
6. POS                    : comienza a vender

CONECTAR CELULARES Y TABLETS (en la misma red WiFi)
- Busca la IP del servidor en: Este equipo > Configuracion de red
- En el celular abre: http://<IP-DEL-SERVIDOR>:$BackendPort
- Autocobro (Self Order / QR): Configuracion > Menu Digital
- Con meseros en tableta  : Configuracion > POS > Self Order
"@ | Set-Content "$InstallDir\CREDENCIALES.txt" -Encoding UTF8
        Write-Log "Credenciales guardadas en: $InstallDir\CREDENCIALES.txt" "Cyan"
        } # fin else SQL ok

    } else {
        Write-Log "ADVERTENCIA: No se pudo generar hash para el cliente. Verifique bcryptjs." "Yellow"
    }
} else {
    Write-Log "AdminEmail no proporcionado - se omite alta de cliente personalizado" "Gray"
}

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
APP_VERSION=$AppVersion
DEFAULT_WORKER_URL=https://pos-iados-relay.axel-muniz.workers.dev
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
# PASO 7: Seeds ya ejecutados antes del backend (solo confirmar)
# =============================================================================
if ($InstallMode -eq "local") {
    Write-Log "Paso 7/$TotalPasos`: Verificando datos iniciales..." "Yellow"
    $ErrorActionPreference = "SilentlyContinue"
    $checkResult = & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME -N -e "SELECT COUNT(*) FROM tenants;" 2>&1
    $ErrorActionPreference = "Stop"
    $countLine = $checkResult | Where-Object { "$_" -match '^\d+$' } | Select-Object -Last 1
    $checkTrim = if ($countLine) { ("$countLine").Trim() } else { "0" }
    Write-Log "  Tenants en BD: $checkTrim" "Gray"
    if ($checkTrim -eq "0") {
        Write-Log "ADVERTENCIA: Seeds no cargaron ningun tenant. Revise los logs." "Yellow"
    } else {
        Write-Log "Datos iniciales confirmados ($checkTrim tenants)" "Green"
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

# Asegurar que $dominio este disponible en el bloque de resumen
$adminEmailTrim = $AdminEmail.Trim()
$dominio = if ($adminEmailTrim.Contains("@")) { $adminEmailTrim.Split("@")[1] } else { "" }

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
if ($adminEmailTrim -ne "") {
    Write-Host "  CREDENCIALES DE ACCESO:" -ForegroundColor White
    Write-Host "    Administrador: $adminEmailTrim / admin123 / PIN 0000" -ForegroundColor Green
    Write-Host "    Cajero:        cajero@$dominio / cajero123 / PIN 1234" -ForegroundColor Green
    Write-Host "    Mesero:        mesero@$dominio / mesero123 / PIN 5678" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Archivo con credenciales: $InstallDir\CREDENCIALES.txt" -ForegroundColor Cyan
} else {
    Write-Host "  Credenciales demo (seed):" -ForegroundColor White
    Write-Host "    Usuario: admin@iados.mx  /  admin123  /  PIN 0000" -ForegroundColor Gray
}
Write-Host ""
Write-Host "  Carpeta: $InstallDir" -ForegroundColor Gray
Write-Host "  Logs:    $InstallDir\logs\" -ForegroundColor Gray
Write-Host ""
Write-Host "  Gestion de servicios:" -ForegroundColor Gray
Write-Host "    INICIAR.bat | DETENER.bat | ESTADO.bat | DESINSTALAR.bat" -ForegroundColor Gray
Write-Host ""

# Abrir navegador
Start-Process "http://localhost:$BackendPort"
