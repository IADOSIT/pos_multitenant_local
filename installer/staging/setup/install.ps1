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
    [string]$NombreNegocio = "",
    # Ultimo recurso, nunca automatico: permite sembrar sobre una base que YA
    # tiene datos. Los seeds empiezan con TRUNCATE TABLE, asi que sin esto el
    # instalador se niega a tocar una base con operacion adentro.
    [switch]$ForzarSembrado,
    # Si el puerto de MariaDB o del backend esta ocupado, buscar otro libre en
    # lugar de abortar. Encendido por omision porque el equipo se opera remoto.
    [bool]$BuscarPuertoLibre = $true,
    # Solo se usa en el camino de ACTUALIZACION: se le pasa a actualizar.ps1
    # para saltarse el ensayo previo. Existe porque si el ensayo no se puede
    # completar por una razon del entorno, sin esto el EXE fallaria igual cada
    # vez y no habria manera de actualizar el equipo a distancia. El respaldo
    # y el auto-revertir siguen activos.
    [switch]$SinEnsayo
)

$ErrorActionPreference = "Stop"
$LOG_FILE = "$InstallDir\logs\install.log"
$DB_NAME = "pos_iados"
$DB_USER = "pos_iados"
$DB_PASS = "pos_iados_2024"
$DB_ROOT_PASS = "P0s_R00t_2024!"

# Escribe texto en UTF-8 de verdad, SIN marca de orden de bytes.
#
# "Set-Content -Encoding UTF8" en el PowerShell que trae Windows mete tres
# bytes invisibles (EF BB BF) al principio del archivo. En un .json eso hace
# que JSON.parse del backend truene y, como el catch devuelve null callado, un
# respaldo bueno se muestra como incompleto y sin forma de revertir. Nunca se
# usa Set-Content -Encoding UTF8 en este paquete; se usa esta funcion.
function Set-TextoSinBOM {
    param(
        [Parameter(Mandatory = $true)][string]$Ruta,
        [Parameter(Mandatory = $true)][AllowEmptyString()][AllowNull()]$Texto
    )
    if ($Texto -is [array]) { $Texto = ($Texto -join "`r`n") }
    if ($null -eq $Texto)   { $Texto = "" }
    $sinBOM = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Ruta, [string]$Texto, $sinBOM)
}

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMsg = "[$timestamp] $Message"
    Write-Host "  $Message" -ForegroundColor $Color
    if (Test-Path (Split-Path $LOG_FILE)) {
        Add-Content -Path $LOG_FILE -Value $logMsg
    }
}

function Esperar-ServicioBorrado {
    param([string]$Nombre, [int]$TimeoutSeconds = 45)
    $fin = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $fin) {
        $sc = & sc.exe query $Nombre 2>&1
        if ("$sc" -match "1060") { return $true }
        if ("$sc" -notmatch "DELETE_PENDING|marcado") {
            & sc.exe delete $Nombre 2>&1 | Out-Null
        }
        Start-Sleep -Seconds 3
    }
    return $false
}

function Puerto-Ocupado {
    param([int]$Port)
    # Se prueba una conexion real en lugar de Get-NetTCPConnection porque esto
    # tiene que funcionar igual si el que escucha es un servicio, un contenedor
    # o un programa suelto.
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Puerto-Libre {
    param([int]$Desde, [int]$Intentos = 40)
    for ($p = $Desde; $p -lt ($Desde + $Intentos); $p++) {
        if (-not (Puerto-Ocupado -Port $p)) { return $p }
    }
    return 0
}

function Quien-Escucha {
    param([int]$Port)
    # Solo para el reporte: saber QUE programa tiene el puerto ahorra una
    # sesion de adivinanzas cuando el equipo se atiende a distancia.
    try {
        $c = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
        $pr = Get-Process -Id $c.OwningProcess -ErrorAction Stop
        return "$($pr.ProcessName) (PID $($pr.Id))"
    } catch {
        return "un programa que no se pudo identificar"
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

$InstallerPath = $InstallerPath.Trim('"').TrimEnd('\')

# =============================================================================
# Instalacion nueva o actualizacion?
#
# Si ya existe version.json, este equipo YA esta operando y lo que toca es una
# actualizacion, no una instalacion. Son dos caminos muy distintos: la
# instalacion siembra datos y genera el .env; la actualizacion no debe hacer
# ninguna de las dos cosas.
#
# La actualizacion se delega a actualizar.ps1, que:
#   1. respalda todo antes de tocar nada (base, imagenes, Excel, ajustes)
#   2. solo reemplaza el programa; nunca uploads, .env ni mariadb\data
#   3. deja que TypeORM migre el esquema al arrancar
#   4. se revierte solo si el sistema no vuelve a arrancar
#
# $EsInstalacionNueva se calcula AQUI, antes de copiar nada, y despues se usa
# como seguro del bloque que limpia datos demo.
# =============================================================================
# Antes esto dependia de un solo archivo: version.json. Si ese archivo faltaba
# (instalacion vieja que no lo escribia, archivo borrado, carpeta distinta), el
# instalador se creia en una maquina limpia y seguia por el camino de
# instalacion nueva, que corre 04_seed_pruebas.sql, y ese archivo empieza con
# 16 TRUNCATE TABLE. O sea: un archivo de menos y el cliente se queda sin
# usuarios, sin productos, sin tiendas y sin licencia.
#
# Ahora se busca CUALQUIER senal de que este equipo ya opera. Una sola alcanza
# para irse por el camino de actualizacion, que no borra nada.
# -----------------------------------------------------------------------------
# El EXE instala en C:\POS-iaDoS y no deja escoger carpeta. Pero si el cliente
# tiene su instalacion en otra ruta (D:\POS-iaDoS, otra letra de disco, una
# instalacion vieja movida de lugar), este script no encontraria ninguna senal
# en C:\POS-iaDoS, se creeria en un equipo nuevo, y sembraria datos de ejemplo
# -con TRUNCATE- mientras su sistema real sigue en la otra carpeta.
#
# Los servicios de Windows saben la ruta verdadera: nssm guarda el programa y
# su carpeta de trabajo en el registro. Se le pregunta a el.
# -----------------------------------------------------------------------------
function Obtener-RutaInstalada {
    foreach ($svc in @("PosIaDos-Backend", "PosIaDos-MariaDB")) {
        $llave = "HKLM:\SYSTEM\CurrentControlSet\Services\$svc\Parameters"
        if (-not (Test-Path $llave)) { continue }
        $par = Get-ItemProperty -Path $llave -ErrorAction SilentlyContinue
        foreach ($valor in @($par.AppDirectory, $par.Application)) {
            if (-not $valor) { continue }
            # AppDirectory = <InstallDir>\backend ; Application = <InstallDir>\node\node.exe
            # o <InstallDir>\mariadb\bin\mysqld.exe. En todos los casos basta
            # subir hasta la carpeta que tenga backend\ o mariadb\ adentro.
            $d = $valor
            if (Test-Path $d -PathType Leaf) { $d = Split-Path -Parent $d }
            for ($i = 0; $i -lt 4 -and $d; $i++) {
                if ((Test-Path (Join-Path $d "backend")) -or (Test-Path (Join-Path $d "mariadb"))) {
                    return $d
                }
                $d = Split-Path -Parent $d
            }
        }
    }
    return ""
}

$rutaReal = Obtener-RutaInstalada
if ($rutaReal -and ($rutaReal.TrimEnd("\") -ne $InstallDir.TrimEnd("\"))) {
    Write-Host ""
    Write-Host "  Los servicios de POS-iaDoS apuntan a otra carpeta:" -ForegroundColor Yellow
    Write-Host "    esperada : $InstallDir" -ForegroundColor Gray
    Write-Host "    real     : $rutaReal" -ForegroundColor Yellow
    Write-Host "  Se va a trabajar sobre la carpeta real, que es donde esta su" -ForegroundColor Green
    Write-Host "  informacion. Instalar en la otra carpeta habria sembrado datos" -ForegroundColor Green
    Write-Host "  de ejemplo y dejado dos instalaciones peleandose el puerto." -ForegroundColor Green
    Write-Host ""
    $InstallDir = $rutaReal
    $LOG_FILE   = "$InstallDir\logs\install.log"
}

$senales = @()
if (Test-Path "$InstallDir\version.json")             { $senales += "version.json" }
if (Test-Path "$InstallDir\backend\.env")             { $senales += "backend\.env (configuracion del cliente)" }
if (Test-Path "$InstallDir\backend\uploads")          { $senales += "backend\uploads (imagenes del cliente)" }
if (Test-Path "$InstallDir\mariadb\data\pos_iados")   { $senales += "mariadb\data\pos_iados (la base de datos)" }
if (Test-Path "$InstallDir\backups")                  { $senales += "carpeta backups" }
foreach ($svc in @("PosIaDos-Backend", "PosIaDos-MariaDB")) {
    if (Get-Service -Name $svc -ErrorAction SilentlyContinue) { $senales += "servicio $svc" }
}

$EsInstalacionNueva = ($senales.Count -eq 0)

if (-not $EsInstalacionNueva) {
    $currentVer = "desconocida"
    try { $currentVer = (Get-Content "$InstallDir\version.json" -Raw -Encoding UTF8 | ConvertFrom-Json).version } catch {}

    Write-Host ""
    Write-Host "  Este equipo YA tiene POS-iaDoS trabajando (version: $currentVer)." -ForegroundColor Yellow
    Write-Host "  Se detecto por:" -ForegroundColor Gray
    foreach ($sn in ($senales | Select-Object -Unique)) { Write-Host "    - $sn" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "  Se va a ACTUALIZAR. No se borra ningun dato." -ForegroundColor Green
    Write-Host ""

    # Nombre del EXE para la pista de ayuda. Si el instalador se corrio desde
    # el .exe, Inno deja su ruta en este variable de entorno; si no, se usa el
    # nombre publicado.
    $InstallerExeHint = "POS-iaDoS-Local.exe"
    try {
        $padre = (Get-CimInstance Win32_Process -Filter "ProcessId=$PID" -ErrorAction Stop).ParentProcessId
        $rutaPadre = (Get-CimInstance Win32_Process -Filter "ProcessId=$padre" -ErrorAction Stop).ExecutablePath
        if ($rutaPadre -and $rutaPadre -like "*.exe") { $InstallerExeHint = $rutaPadre }
    } catch { }

    $actualizador = Join-Path $InstallerPath "setup\actualizar.ps1"
    if (-not (Test-Path $actualizador)) {
        Write-Host "  ERROR: este paquete no trae setup\actualizar.ps1." -ForegroundColor Red
        Write-Host "  No se continua: instalar encima de una instalacion existente" -ForegroundColor Red
        Write-Host "  borraria datos del negocio." -ForegroundColor Red
        exit 1
    }

    # Las herramientas de respaldo y revert se refrescan ANTES de actualizar,
    # porque el equipo puede traer una version vieja o no traerlas. Se ejecuta
    # la copia del PAQUETE, no la de tools, para que el script no se
    # sobrescriba a si mismo mientras corre.
    New-Item -ItemType Directory -Force -Path "$InstallDir\tools" | Out-Null
    Copy-Item -Path "$InstallerPath\setup\*.ps1" -Destination "$InstallDir\tools\" -Force -ErrorAction SilentlyContinue
    if (Test-Path "$InstallerPath\setup\node") {
        New-Item -ItemType Directory -Force -Path "$InstallDir\tools\node" | Out-Null
        Copy-Item -Path "$InstallerPath\setup\node\*" -Destination "$InstallDir\tools\node\" -Recurse -Force -ErrorAction SilentlyContinue
    }

    $argsAct = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $actualizador,
                 "-InstallDir", $InstallDir, "-Paquete", $InstallerPath, "-SiSinPreguntar")
    if ($SinEnsayo) {
        Write-Host "  Se pidio /SINENSAYO: se actualiza sin la prueba previa." -ForegroundColor Yellow
        Write-Host "  El respaldo y el revertir automatico siguen activos." -ForegroundColor Yellow
        Write-Host ""
        $argsAct += "-SinEnsayo"
    }
    & powershell @argsAct
    $codigoAct = $LASTEXITCODE

    # Si la actualizacion se corto porque el ensayo no se pudo completar, aqui
    # se dice en una linea como salir del paso. Sin esto, el reporte termina
    # pidiendo un parametro que desde el EXE no se podia pasar.
    if ($codigoAct -eq 1) {
        Write-Host ""
        Write-Host "  Si el motivo fue que el ENSAYO no se pudo completar (no que" -ForegroundColor Yellow
        Write-Host "  el ensayo dijera que no), se puede actualizar saltandoselo." -ForegroundColor Yellow
        Write-Host "  Abre una ventana de comandos como Administrador y corre:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "     ""$InstallerExeHint"" /SINENSAYO" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  El respaldo previo y el revertir automatico siguen activos." -ForegroundColor Yellow
        Write-Host ""
    }
    exit $codigoAct
}

# Detectar modo de instalacion (local o online). Se lee ANTES de la revision
# previa porque de el depende si hace falta MariaDB en el paquete.
$InstallMode = "local"
$ModeFile = Join-Path $InstallerPath "install-mode.txt"
if (Test-Path $ModeFile) {
    $InstallMode = (Get-Content $ModeFile -Raw).Trim().ToLower()
}
Write-Log "Modo de instalacion: $InstallMode" "Cyan"

# =============================================================================
# PASO 0: REVISION PREVIA DEL EQUIPO
#
# Todo lo que se revisa aqui es algo que ya tumbo una instalacion antes. Se
# hace ANTES de copiar un solo archivo, para que un equipo que no cumple no
# quede a medio instalar. Pensado para Windows 11 Pro de 64 bits.
# =============================================================================
Write-Log "Paso 0: Revisando el equipo..." "Yellow"

$problemas = @()

# --- 1. Arquitectura -------------------------------------------------------
# El MariaDB y el Node que lleva el paquete son de 64 bits. En un Windows de
# 32 bits ninguno arranca y el error que da Windows no explica por que.
if ([System.Environment]::Is64BitOperatingSystem) {
    Write-Log "  Windows de 64 bits: OK" "Green"
} else {
    $problemas += "Este Windows es de 32 bits. POS-iaDoS on-premise requiere 64 bits."
}

$verWin = "desconocida"
try { $verWin = (Get-CimInstance Win32_OperatingSystem).Caption } catch { }
Write-Log "  Sistema: $verWin" "Gray"

# --- 2. Universal CRT ------------------------------------------------------
# mysqld.exe importa api-ms-win-crt-*.dll. OJO: esos nombres NO son archivos,
# son "api sets" que Windows traduce en memoria a ucrtbase.dll; en System32 no
# existe ningun api-ms-win-crt-*.dll y aun asi MariaDB corre. Por eso aqui se
# busca ucrtbase.dll, que si es el archivo real de la Universal CRT.
# Windows 10 y 11 la traen de fabrica. Si de verdad faltara, MariaDB no
# arrancaria, pero no se aborta por esto: se avisa y se sigue, porque una
# comprobacion de requisitos no debe ser mas estricta que la realidad.
$ucrt = @("$env:SystemRoot\System32\ucrtbase.dll",
          "$env:SystemRoot\System32\downlevel\api-ms-win-crt-runtime-l1-1-0.dll")
if ($ucrt | Where-Object { Test-Path $_ }) {
    Write-Log "  Librerias del sistema (Universal CRT): OK" "Green"
} else {
    Write-Log "  AVISO: no se encontro ucrtbase.dll (Universal CRT)." "Yellow"
    Write-Log "  Si MariaDB no arranca, instala las actualizaciones de Windows." "Yellow"
    Write-Log "  La instalacion continua: este aviso no la detiene." "Yellow"
}

# --- 3. Espacio en disco ---------------------------------------------------
# El programa pesa ~450 MB, pero cada respaldo guarda base + imagenes + Excel.
# Sin margen, el primer respaldo truena a la mitad y deja un .sql incompleto,
# que es peor que no tener respaldo porque parece que si hay.
$unidad = (Split-Path -Qualifier $InstallDir)
try {
    $libreGB = [math]::Round((Get-PSDrive -Name $unidad.TrimEnd(":")).Free / 1GB, 1)
    if ($libreGB -ge 5) {
        Write-Log "  Espacio libre en $unidad $libreGB GB: OK" "Green"
    } elseif ($libreGB -ge 2) {
        Write-Log "  AVISO: solo hay $libreGB GB libres en $unidad. Alcanza para instalar," "Yellow"
        Write-Log "  pero los respaldos se van a quedar sin espacio pronto." "Yellow"
    } else {
        $problemas += "Solo hay $libreGB GB libres en $unidad. Se necesitan al menos 2 GB (recomendado 5 GB para respaldos)."
    }
} catch {
    Write-Log "  No se pudo medir el espacio libre en $unidad (se continua)" "Gray"
}

# --- 4. Permiso real de escritura -----------------------------------------
# El Acceso Controlado a Carpetas de Windows 11 y algunos antivirus dejan
# crear la carpeta pero bloquean escribir dentro. Se comprueba de verdad.
try {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    # La carpeta de logs se crea aqui a proposito: Write-Log solo escribe al
    # archivo si ya existe, y este reporte previo es justo el que hay que poder
    # mandar cuando el equipo se atiende a distancia.
    New-Item -ItemType Directory -Force -Path "$InstallDir\logs" | Out-Null
    $pruebaEsc = Join-Path $InstallDir ".prueba-escritura"
    "ok" | Set-Content $pruebaEsc -ErrorAction Stop
    Remove-Item $pruebaEsc -Force -ErrorAction SilentlyContinue
    Write-Log "  Permiso de escritura en ${InstallDir}: OK" "Green"
} catch {
    $problemas += "No se puede escribir en $InstallDir. Revisa 'Acceso controlado a carpetas' en Seguridad de Windows o el antivirus, y corre el instalador como Administrador."
}

# --- 5. Puerto del backend -------------------------------------------------
# El 3000 lo usan muchas cosas (otro Node, Grafana, un dev server olvidado).
# Si esta tomado, antes el servicio arrancaba y moria callado. Ahora se elige
# otro puerto AQUI, antes de escribir el .env y antes de CREDENCIALES.txt, que
# es donde el cliente lee la direccion para entrar.
if (Puerto-Ocupado -Port $BackendPort) {
    $quienBack = Quien-Escucha -Port $BackendPort
    Write-Log "  El puerto $BackendPort ya lo usa $quienBack." "Yellow"
    if (-not $BuscarPuertoLibre) {
        $problemas += "El puerto $BackendPort esta ocupado por $quienBack."
    } else {
        $nuevoPuertoApp = Puerto-Libre -Desde 3001
        if ($nuevoPuertoApp -eq 0) {
            $problemas += "No se encontro ningun puerto libre entre 3001 y 3040 para el sistema."
        } else {
            $BackendPort = $nuevoPuertoApp
            Write-Log "  POS-iaDoS se abrira en el puerto $BackendPort" "Green"
        }
    }
} else {
    Write-Log "  Puerto $BackendPort libre: OK" "Green"
}

# --- 6. Piezas del paquete -------------------------------------------------
# Si el EXE se extrajo a medias (antivirus, disco lleno, copia por red), mejor
# saberlo ahora que a la mitad de la instalacion.
$piezas = @(
    @{ R = "$InstallerPath\app\backend\dist\main.js"; N = "programa (backend)" },
    @{ R = "$InstallerPath\runtime\node\node.exe";    N = "Node.js" },
    @{ R = "$InstallerPath\runtime\nssm.exe";         N = "administrador de servicios" }
)
if ($InstallMode -ne "online") {
    $piezas += @{ R = "$InstallerPath\runtime\mariadb\bin\mysqld.exe"; N = "base de datos MariaDB" }
}
foreach ($pz in $piezas) {
    if (-not (Test-Path $pz.R)) { $problemas += "El paquete no trae: $($pz.N) ($($pz.R))" }
}

# --- Veredicto -------------------------------------------------------------
if ($problemas.Count -gt 0) {
    Write-Log "" "Red"
    Write-Log "INSTALACION CANCELADA. No se cambio nada en el equipo." "Red"
    Write-Log "" "Red"
    foreach ($pb in $problemas) { Write-Log "  - $pb" "Red" }
    Write-Log "" "Red"
    Write-Log "Manda esta pantalla completa (o el archivo $LOG_FILE) para resolverlo." "Yellow"
    exit 1
}
Write-Log "Equipo revisado: se puede instalar" "Green"

# Leer version del paquete
$AppVersion = ""
$versionFile = Join-Path $InstallerPath "version.json"
if (Test-Path $versionFile) {
    $AppVersion = (Get-Content $versionFile -Raw -Encoding UTF8 | ConvertFrom-Json).version
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
# Herramientas de mantenimiento en Node (respaldo, imagenes, ajustes, Excel).
# Usan mysql2 y exceljs del propio backend, asi que no instalan nada extra.
if (Test-Path "$InstallerPath\setup\node") {
    New-Item -ItemType Directory -Force -Path "$InstallDir\tools\node" | Out-Null
    Copy-Item -Path "$InstallerPath\setup\node\*" -Destination "$InstallDir\tools\node\" -Recurse -Force
    Write-Log "  Herramientas de respaldo y mantenimiento copiadas" "Gray"
} else {
    Write-Log "  ADVERTENCIA: el paquete no trae setup\node (sin respaldos automaticos)" "Yellow"
}
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

# --- BATs de respaldo y mantenimiento -----------------------------------------
# Van en la raiz para que se abran con doble clic, sin escribir comandos.
@"
@echo off
title POS-iaDoS - Respaldar
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)
echo.
echo   Se va a respaldar TODO: base de datos, imagenes, Excel y ajustes.
echo   No se borra nada. El sistema se detiene unos segundos.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0tools\respaldar.ps1" -InstallDir "%~dp0." -Etiqueta manual
echo.
pause
"@ | Set-Content "$InstallDir\RESPALDAR.bat"

@"
@echo off
title POS-iaDoS - Regresar a un respaldo
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)
echo.
echo   Esto REGRESA el sistema a como estaba en un respaldo anterior.
echo   Antes de hacerlo guarda el estado de hoy, para poder volver.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0tools\revertir.ps1" -InstallDir "%~dp0." -Listar
echo.
set /p CARPETA="  Nombre de la carpeta del respaldo (Enter para salir): "
if "%CARPETA%"=="" exit /b
powershell -ExecutionPolicy Bypass -File "%~dp0tools\revertir.ps1" -InstallDir "%~dp0." -Respaldo "%~dp0backups\%CARPETA%"
echo.
pause
"@ | Set-Content "$InstallDir\REVERTIR.bat"

@"
@echo off
title POS-iaDoS - Mantenimiento
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)
powershell -ExecutionPolicy Bypass -File "%~dp0tools\mantenimiento.ps1" -InstallDir "%~dp0."
"@ | Set-Content "$InstallDir\MANTENIMIENTO.bat"

@"
@echo off
title POS-iaDoS - Actualizar
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)
echo.
echo   Para actualizar hay dos caminos:
echo.
echo     1) Ejecutar el instalador nuevo (el .exe). Detecta que ya esta
echo        instalado, respalda todo y actualiza sin borrar datos.
echo.
echo     2) Desde el sistema: Configuracion ^> Mantenimiento ^> Actualizar
echo.
echo   Si ya tienes la carpeta de un paquete de actualizacion, escribela
echo   aqui. Si no, cierra esta ventana y usa el .exe.
echo.
set /p PAQUETE="  Carpeta del paquete (Enter para salir): "
if "%PAQUETE%"=="" exit /b
powershell -ExecutionPolicy Bypass -File "%~dp0tools\actualizar.ps1" -InstallDir "%~dp0." -Paquete "%PAQUETE%"
echo.
pause
"@ | Set-Content "$InstallDir\ACTUALIZAR.bat"

# --- ENSAYAR.bat ---------------------------------------------------------------
# Prueba una actualizacion contra una COPIA de la base, sin detener el sistema.
# Existe para poder decidir si se actualiza o no ANTES de tocar nada.
@"
@echo off
title POS-iaDoS - Ensayar una actualizacion
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)
echo.
echo   Esto PRUEBA una version nueva contra una copia de tu base de datos.
echo.
echo     - El sistema NO se detiene: puedes seguir vendiendo.
echo     - La base de datos real solo se LEE, nunca se escribe.
echo     - Al final dice si la actualizacion es segura o no.
echo.
echo   Escribe la carpeta del paquete nuevo (la que trae app\backend).
echo.
set /p PAQUETE="  Carpeta del paquete (Enter para salir): "
if "%PAQUETE%"=="" exit /b
powershell -ExecutionPolicy Bypass -File "%~dp0tools\ensayar.ps1" -InstallDir "%~dp0." -Paquete "%PAQUETE%"
echo.
echo   El resultado quedo en ULTIMO-ENSAYO.txt
echo.
pause
"@ | Set-Content "$InstallDir\ENSAYAR.bat"

# --- REVISAR.bat ---------------------------------------------------------------
# Revisa el equipo sin cambiar NADA y deja un reporte de texto. Es lo primero
# que se pide cuando el equipo se opera a distancia y no se puede ver.
@"
@echo off
title POS-iaDoS - Revisar el equipo
echo.
echo   Esta revision SOLO LEE. No detiene el sistema, no toca la base de
echo   datos, no borra nada. Deja un reporte de texto al terminar.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0tools\revisar-equipo.ps1" -InstallDir "%~dp0."
echo.
echo   El reporte quedo en REVISION-EQUIPO.txt
echo.
pause
"@ | Set-Content "$InstallDir\REVISAR.bat"

New-Item -ItemType Directory -Force -Path "$InstallDir\backups" | Out-Null

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

# -----------------------------------------------------------------------------
# Puerto 3306 ocupado por OTRO servidor (XAMPP, Laragon, un MySQL que ya tenia
# el equipo). Esto era el segundo camino a la catastrofe: nuestro mysqld no
# arrancaba, Wait-ForPort veia el puerto abierto, lo daba por bueno, y los
# seeds -que empiezan con TRUNCATE- se ejecutaban contra el servidor AJENO.
# Si el puerto esta tomado y el que escucha no es nuestro servicio, nos
# movemos a otro puerto y ahi no hay ninguna base que podamos arruinar.
# -----------------------------------------------------------------------------
$nuestroMariaDB = Get-Service -Name "PosIaDos-MariaDB" -ErrorAction SilentlyContinue
if ((Puerto-Ocupado -Port $MariaDBPort) -and (-not $nuestroMariaDB -or $nuestroMariaDB.Status -ne "Running")) {
    $quien = Quien-Escucha -Port $MariaDBPort
    Write-Log "  El puerto $MariaDBPort ya lo esta usando $quien y no es nuestro MariaDB." "Yellow"

    if (-not $BuscarPuertoLibre) {
        Write-Log "ERROR: puerto $MariaDBPort ocupado por otro servidor de base de datos." "Red"
        Write-Log "No se continua: sembrar contra ese servidor borraria datos ajenos." "Red"
        exit 1
    }

    $nuevoPuertoDb = Puerto-Libre -Desde 3307
    if ($nuevoPuertoDb -eq 0) {
        Write-Log "ERROR: no se encontro ningun puerto libre entre 3307 y 3346." "Red"
        exit 1
    }
    $MariaDBPort = $nuevoPuertoDb
    Write-Log "  POS-iaDoS usara el puerto $MariaDBPort para su propia MariaDB." "Green"
}

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

# Windows deja el servicio "marcado para eliminacion" mientras algo tenga
# abierto el administrador de servicios (services.msc, el Visor de eventos, el
# antivirus). En ese estado nssm install falla y el instalador seguia de largo
# dejando el POS sin base de datos. Se espera a que Windows lo suelte.
Esperar-ServicioBorrado -Nombre $SVC_MARIADB | Out-Null

& $NSSM install $SVC_MARIADB $MYSQLD "--defaults-file=$MARIADB_DIR\my.ini"
& $NSSM set $SVC_MARIADB DisplayName "POS-iaDoS MariaDB"
& $NSSM set $SVC_MARIADB Description "Servidor de base de datos MariaDB para POS-iaDoS"
& $NSSM set $SVC_MARIADB Start SERVICE_AUTO_START
& $NSSM set $SVC_MARIADB AppStdout "$InstallDir\logs\mariadb-stdout.log"
& $NSSM set $SVC_MARIADB AppStderr "$InstallDir\logs\mariadb-stderr.log"
# Misma rotacion que el backend: sin esto la bitacora de la base crece sin
# limite en un equipo que nadie revisa, y el disco lleno la deja sin arrancar.
& $NSSM set $SVC_MARIADB AppRotateFiles 1
& $NSSM set $SVC_MARIADB AppRotateOnline 1
& $NSSM set $SVC_MARIADB AppRotateBytes 10485760

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
# COMPUERTA DE BASE VIRGEN  (el candado que no se puede saltar)
#
# 04_seed_pruebas.sql arranca con 16 TRUNCATE TABLE (tenants, empresas,
# tiendas, licencias, users, categorias, productos, producto_tienda,
# ticket_configs, cajas, gateway_configs, menu_digital_config, backup_configs,
# mesas, mesa_asignaciones, mesas_juntas). Si eso corre sobre un negocio en
# marcha se pierde TODO: usuarios, catalogo y la licencia.
#
# Llegar hasta aqui ya significa que no se detecto instalacion previa, pero eso
# se juzga por archivos y servicios. Esta compuerta le pregunta a la unica
# fuente que no miente: la base de datos. Si tiene una sola fila de operacion,
# no se siembra. Punto.
# =============================================================================
$tablasCenso = @("users","productos","ventas","tenants","empresas","tiendas","pedidos","categorias","venta_detalles","movimientos_caja","producto_tienda","licencias")

$ErrorActionPreference = "SilentlyContinue"
$listaIn   = ($tablasCenso | ForEach-Object { "'" + $_ + "'" }) -join ","
$sqlCenso  = "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='" + $DB_NAME + "' AND TABLE_NAME IN (" + $listaIn + ");"
$tablasHay = & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort -N -e $sqlCenso 2>$null
$ErrorActionPreference = "Stop"

$filasPorTabla = @{}
$filasTotales  = 0
foreach ($t in @($tablasHay)) {
    $tabla = "$t".Trim()
    if ($tabla -eq "") { continue }
    $ErrorActionPreference = "SilentlyContinue"
    $sqlCuenta = "SELECT COUNT(*) FROM ``" + $tabla + "``;"
    $n = & $MYSQL -u $DB_USER -p"$DB_PASS" --host=127.0.0.1 --port=$MariaDBPort $DB_NAME -N -e $sqlCuenta 2>$null
    $ErrorActionPreference = "Stop"
    $num = 0
    if ([int]::TryParse(("$n".Trim()), [ref]$num) -and $num -gt 0) {
        $filasPorTabla[$tabla] = $num
        $filasTotales += $num
    }
}

$BaseVirgen = ($filasTotales -eq 0)

if (-not $BaseVirgen) {
    Write-Log "" "Yellow"
    Write-Log "  ATENCION: la base '$DB_NAME' YA TIENE DATOS ($filasTotales filas)." "Yellow"
    foreach ($k in ($filasPorTabla.Keys | Sort-Object)) {
        Write-Log ("    {0,-22} {1,8} filas" -f $k, $filasPorTabla[$k]) "Gray"
    }
    Write-Log "" "Yellow"

    if (-not $ForzarSembrado) {
        Write-Log "INSTALACION CANCELADA A PROPOSITO. No se borro nada." "Red"
        Write-Log "" "Red"
        Write-Log "Este equipo parecia nuevo (no se hallo instalacion previa), pero la base" "Red"
        Write-Log "de datos tiene operacion adentro. Sembrar los datos de ejemplo borraria" "Red"
        Write-Log "esas $filasTotales filas y eso no se puede deshacer." "Red"
        Write-Log "" "Red"
        Write-Log "Que hacer:" "Yellow"
        Write-Log "  - Si este equipo YA usaba POS-iaDoS: corre ACTUALIZAR.bat, no el" "Yellow"
        Write-Log "    instalador. La actualizacion respalda y no borra nada." "Yellow"
        Write-Log "  - Si de verdad quieres empezar de cero y perder esos datos: vuelve a" "Yellow"
        Write-Log "    correr con -ForzarSembrado (respalda la base antes de sembrar)." "Yellow"
        Write-Log "" "Yellow"
        exit 1
    }

    # Camino explicito, nunca automatico: respaldo obligatorio ANTES de sembrar.
    Write-Log "  -ForzarSembrado activo: se respalda la base antes de sembrar." "Yellow"
    $selloResp = Get-Date -Format "yyyyMMdd-HHmmss"
    $dirResp   = "$InstallDir\backups\antes-de-sembrar-$selloResp"
    New-Item -ItemType Directory -Force -Path $dirResp | Out-Null
    $MYSQLDUMP = "$MARIADB_DIR\bin\mysqldump.exe"
    $archResp  = "$dirResp\base-datos.sql"

    # El volcado se escribe con la salida redirigida, NUNCA por tuberia.
    #
    # Antes esta linea era:
    #     & $MYSQLDUMP @argsDump | Set-Content -Encoding UTF8 $archResp
    # y tenia dos fallas juntas. La tuberia de PowerShell convierte la salida
    # de mysqldump a texto con la pagina de codigos de la consola y la vuelve a
    # escribir, asi que todo acento y todo dato binario de su operacion quedaba
    # alterado; y Set-Content -Encoding UTF8 agrega tres bytes invisibles al
    # principio que hacen que mysql truene al restaurar, con un
    # "error in your SQL syntax at line 1". Un respaldo corrompido y que
    # tampoco se puede restaurar, tomado el instante antes de vaciar tablas.
    #
    # Redirigiendo la salida, los bytes de mysqldump llegan al archivo tal
    # cual. La contrasena va en un archivo temporal y no en la linea de
    # comandos, que es visible para cualquiera con el administrador de tareas.
    $cnfTmp  = Join-Path $dirResp "cliente.cnf"
    $errDump = Join-Path $dirResp "mysqldump-errores.txt"
    $dumpOk  = $false
    try {
        Set-Content -Path $cnfTmp -Encoding ASCII -NoNewline `
            -Value "[client]`r`nuser=$DB_USER`r`npassword=""$DB_PASS""`r`nhost=127.0.0.1`r`nport=$MariaDBPort`r`n"

        $argsDump = @("--defaults-extra-file=$cnfTmp",
                      "--single-transaction", "--routines", "--triggers", "--events",
                      "--hex-blob", "--default-character-set=utf8mb4",
                      "--add-drop-table", "--complete-insert",
                      "--databases", $DB_NAME)

        $pDump = Start-Process -FilePath $MYSQLDUMP -ArgumentList $argsDump `
                    -RedirectStandardOutput $archResp -RedirectStandardError $errDump `
                    -NoNewWindow -Wait -PassThru
        if ($pDump.ExitCode -eq 0) { $dumpOk = $true }
        else {
            Write-Log "  mysqldump termino con codigo $($pDump.ExitCode)" "Red"
            if (Test-Path $errDump) {
                foreach ($l in (Get-Content $errDump -ErrorAction SilentlyContinue | Select-Object -First 6)) {
                    Write-Log "    $l" "Red"
                }
            }
        }
    } finally {
        if (Test-Path $cnfTmp) { Remove-Item -Path $cnfTmp -Force -ErrorAction SilentlyContinue }
    }

    if (-not $dumpOk -or -not (Test-Path $archResp) -or (Get-Item $archResp).Length -lt 1024) {
        Write-Log "ERROR: el respaldo previo quedo vacio o no se pudo crear." "Red"
        Write-Log "No se siembra sin respaldo. Cancelado, nada se borro." "Red"
        exit 1
    }
    $mbResp = [math]::Round((Get-Item $archResp).Length / 1MB, 2)
    Write-Log "  Respaldo guardado: $archResp ($mbResp MB)" "Green"
} else {
    Write-Log "  Base de datos vacia: se puede sembrar sin riesgo." "Green"
}

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

# Doble seguro: 04 es el unico seed con TRUNCATE. Ademas de la compuerta de
# arriba, aqui se vuelve a exigir que la base estuviera vacia (o que se haya
# forzado explicitamente, lo que ya dejo un respaldo en backups\).
$seedFile04 = "$InstallDir\database\04_seed_pruebas.sql"
if ((Test-Path $seedFile04) -and -not ($BaseVirgen -or $ForzarSembrado)) {
    Write-Log "  04_seed OMITIDO: la base tiene datos y ese seed borraria tablas." "Yellow"
} elseif (Test-Path $seedFile04) {
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

        # Bloque TRUNCATE solo si no se pidieron datos demo.
        #
        # DOBLE SEGURO: ademas exige que sea una instalacion NUEVA. Este bloque
        # existe para limpiar los datos de demostracion del seed antes de dar
        # de alta al cliente real; si el equipo ya estaba instalado, esas
        # tablas traen el negocio del cliente y vaciarlas seria perderlo todo.
        # La rama de actualizacion ya sale del script antes de llegar aqui;
        # esto es el seguro por si alguien corre install.ps1 a mano.
        $truncateBlock = ""
        if ($InstallDemoData -ne "1" -and -not $EsInstalacionNueva) {
            Write-Log "  Instalacion existente detectada: NO se limpia ninguna tabla." "Yellow"
        }
        if ($InstallDemoData -ne "1" -and $EsInstalacionNueva) {
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

-- Licencia PERMANENTE. fecha_fin en NULL y permanente = 1 es lo que hace que
-- LicenciaGuard nunca bloquee: sin esto el equipo deja de poder vender a los
-- 30 dias y le pide un codigo de activacion, que es justo lo que no queremos
-- en una instalacion sin internet. machine_locked se queda en 0 a proposito,
-- para que cambiar de computadora o de disco no invalide la licencia.
INSERT INTO ``licencias`` (tenant_id, codigo_instalacion, plan, features, max_tiendas, max_usuarios,
  fecha_inicio, fecha_fin, grace_days, offline_allowed, estado, permanente, machine_locked,
  activated_at, created_at, updated_at)
  VALUES (@t, '$eLic', 'pro', '["pos","caja","pedidos","reportes","dashboard"]',
  5, 20, '$hoy', NULL, 30, 1, 'activa', 1, 0, NOW(), NOW(), NOW());

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

RESPALDOS Y ACTUALIZACIONES (doble clic en la carpeta $InstallDir)
------------------------------------------------------------------
RESPALDAR.bat      Guarda TODO ahora: base de datos, imagenes, un Excel con
                   todos los datos y la lista de ajustes activos.
ENSAYAR.bat        Prueba una version nueva contra una COPIA de tu base, sin
                   detener el sistema. Dice si la actualizacion es segura
                   ANTES de aplicarla. El resultado queda en ULTIMO-ENSAYO.txt
ACTUALIZAR.bat     Aplica una version nueva. Respalda, ensaya y solo entonces
                   actualiza; si algo falla regresa solo a la version de hoy.
REVERTIR.bat       Regresa el sistema a cualquier respaldo anterior.
MANTENIMIENTO.bat  Menu con todo lo anterior mas diagnostico y revision de
                   las imagenes.

Tambien desde el sistema: Configuracion > Mantenimiento > Este equipo

Ningun dato se borra en ninguna de estas opciones. Lo unico que sobrescribe
es REVERTIR, y antes de hacerlo guarda el estado de hoy para poder volver.
"@ | ForEach-Object { Set-TextoSinBOM -Ruta "$InstallDir\CREDENCIALES.txt" -Texto $_ }
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
        Set-TextoSinBOM -Ruta "$InstallDir\backend\.env" -Texto ($envContent -join "`r`n")
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

# Igual que con MariaDB: si Windows dejo el servicio en "borrado pendiente",
# nssm install falla y el POS se quedaria sin servicio. Se espera a que lo suelte.
Esperar-ServicioBorrado -Nombre $SVC_BACKEND | Out-Null

& $NSSM install $SVC_BACKEND $NODE_EXE "dist\main.js"
& $NSSM set $SVC_BACKEND DisplayName "POS-iaDoS Backend"
& $NSSM set $SVC_BACKEND Description "Servidor API y Frontend para POS-iaDoS"
& $NSSM set $SVC_BACKEND AppDirectory "$InstallDir\backend"
& $NSSM set $SVC_BACKEND Start SERVICE_AUTO_START
& $NSSM set $SVC_BACKEND AppStdout "$InstallDir\logs\backend-stdout.log"
& $NSSM set $SVC_BACKEND AppStderr "$InstallDir\logs\backend-stderr.log"
& $NSSM set $SVC_BACKEND AppEnvironmentExtra "NODE_ENV=production"
# IMPORTANTE: no matar el arbol de procesos al detener el servicio.
# El boton "Actualizar" de la aplicacion lanza actualizar.ps1 como hijo
# desprendido de este backend, y lo primero que hace ese script es detener
# este mismo servicio. Con el valor de fabrica (1), nssm recorreria el arbol
# y mataria al actualizador justo en ese momento: la actualizacion quedaria
# a medias y tampoco correria el revertir automatico. Con 0, nssm detiene
# unicamente el node.exe. Los node colgados los cierra actualizar.ps1 solo.
& $NSSM set $SVC_BACKEND AppKillProcessTree 0
# Rotar las bitacoras a los 10 MB. Este equipo opera sin que nadie lo mire
# durante meses; sin rotacion estos archivos crecen hasta llenar el disco y
# con el disco lleno la base no arranca.
& $NSSM set $SVC_BACKEND AppRotateFiles 1
& $NSSM set $SVC_BACKEND AppRotateOnline 1
& $NSSM set $SVC_BACKEND AppRotateBytes 10485760

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
Write-Host "  Respaldos y mantenimiento:" -ForegroundColor White
Write-Host "    RESPALDAR.bat      respalda base, imagenes, Excel y ajustes" -ForegroundColor Green
Write-Host "    REVERTIR.bat       regresa a un respaldo anterior" -ForegroundColor Green
Write-Host "    MANTENIMIENTO.bat  menu con todo (diagnostico incluido)" -ForegroundColor Green
Write-Host "    ACTUALIZAR.bat     actualiza sin borrar datos" -ForegroundColor Green
Write-Host ""
Write-Host "  Se recomienda correr RESPALDAR.bat una vez por semana." -ForegroundColor Cyan
Write-Host ""

# Abrir navegador
Start-Process "http://localhost:$BackendPort"
