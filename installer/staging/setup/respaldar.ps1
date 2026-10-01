# =============================================================================
#  POS-iaDoS - RESPALDO COMPLETO
#
#  Deja en una sola carpeta todo lo que hace falta para devolver el sistema a
#  como estaba en este momento:
#
#    base-datos.sql        volcado completo (mysqldump), con rutinas y triggers
#    uploads\              todas las imagenes y archivos subidos
#    config\.env           la configuracion del backend
#    datos-completos.xlsx  la base entera en Excel, para poder leerla
#    AJUSTES.txt           que trae prendido el cliente hoy
#    IMAGENES.txt          estado de cada URL de imagen
#    manifest.json         inventario con tamanos y huellas SHA256
#    RESUMEN.txt           el reporte que se lee primero
#
#  Uso:
#    .\respaldar.ps1
#    .\respaldar.ps1 -Etiqueta preactualizacion
#    .\respaldar.ps1 -SinExcel          (mas rapido, sin el Excel)
#
#  La contrasena de la base nunca se pasa por linea de comandos ni se imprime:
#  se escribe en un archivo temporal de opciones que se borra al terminar.
# =============================================================================
param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [string]$Etiqueta   = "manual",
    [string]$Destino    = "",
    [switch]$SinExcel,
    [switch]$SinImagenes,
    [switch]$NoDetenerServicio,
    [switch]$Silencioso
)

$ErrorActionPreference = "Stop"

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


# -----------------------------------------------------------------------------
#  Salida: todo va a pantalla y al mismo tiempo al log del respaldo. El cliente
#  trabaja en remoto y sin supervision visual, asi que el log es la unica
#  evidencia de lo que paso.
# -----------------------------------------------------------------------------
$script:LogPath = $null
$script:Lineas  = New-Object System.Collections.ArrayList

function Escribir {
    param([string]$Texto = "", [string]$Color = "Gray")
    [void]$script:Lineas.Add($Texto)
    if (-not $Silencioso) { Write-Host $Texto -ForegroundColor $Color }
    if ($script:LogPath) { Add-Content -Path $script:LogPath -Value $Texto -Encoding UTF8 }
}
function Titulo { param([string]$t) Escribir ""; Escribir "  $t" "Cyan" }
function Ok    { param([string]$t) Escribir "    OK  $t" "Green" }
function Aviso { param([string]$t) Escribir "    !   $t" "Yellow" }
function Falla { param([string]$t) Escribir "    X   $t" "Red" }

function Terminar {
    param([int]$Codigo, [string]$Mensaje)
    Escribir ""
    if ($Codigo -eq 0) { Escribir "  $Mensaje" "Green" } else { Escribir "  $Mensaje" "Red" }
    Escribir ""
    exit $Codigo
}

# -----------------------------------------------------------------------------
#  Lectura del .env sin imprimir nada
# -----------------------------------------------------------------------------
function Leer-Env {
    param([string]$Ruta)
    $h = @{}
    foreach ($linea in (Get-Content -Path $Ruta -Encoding UTF8)) {
        $t = $linea.Trim()
        if ($t -eq "" -or $t.StartsWith("#")) { continue }
        $i = $t.IndexOf("=")
        if ($i -lt 1) { continue }
        $clave = $t.Substring(0, $i).Trim()
        $valor = $t.Substring($i + 1).Trim()
        if ($valor.Length -gt 1 -and (($valor.StartsWith('"') -and $valor.EndsWith('"')) -or ($valor.StartsWith("'") -and $valor.EndsWith("'")))) {
            $valor = $valor.Substring(1, $valor.Length - 2)
        }
        $h[$clave] = $valor
    }
    return $h
}

function Tamano-Legible {
    param([double]$Bytes)
    if ($Bytes -ge 1073741824) { return ("{0:N2} GB" -f ($Bytes / 1073741824)) }
    if ($Bytes -ge 1048576)    { return ("{0:N1} MB" -f ($Bytes / 1048576)) }
    if ($Bytes -ge 1024)       { return ("{0:N0} KB" -f ($Bytes / 1024)) }
    return "$Bytes B"
}

function Tamano-Carpeta {
    param([string]$Ruta)
    if (-not (Test-Path $Ruta)) { return 0 }
    $m = Get-ChildItem -Path $Ruta -Recurse -File -ErrorAction SilentlyContinue |
         Measure-Object -Property Length -Sum
    if ($null -eq $m.Sum) { return 0 }
    return [double]$m.Sum
}

function Huella {
    param([string]$Ruta)
    try { return (Get-FileHash -Path $Ruta -Algorithm SHA256).Hash } catch { return "" }
}

function Servicio {
    param([string]$Accion, [string]$Nombre)
    if (Test-Path $script:NSSM) {
        & $script:NSSM $Accion $Nombre 2>&1 | Out-Null
    } elseif ($Accion -eq "stop") {
        Stop-Service -Name $Nombre -Force -ErrorAction SilentlyContinue
    } else {
        Start-Service -Name $Nombre -ErrorAction SilentlyContinue
    }
}

function Esperar-Puerto {
    param([int]$Puerto, [int]$Segundos = 90)
    $fin = (Get-Date).AddSeconds($Segundos)
    while ((Get-Date) -lt $fin) {
        try {
            $c = New-Object System.Net.Sockets.TcpClient
            $c.Connect("127.0.0.1", $Puerto)
            $c.Close()
            return $true
        } catch {
            Start-Sleep -Milliseconds 1500
        }
    }
    return $false
}

# =============================================================================
#  1. Revisiones previas - nada se toca hasta que todo esto pase
# =============================================================================
$inicio = Get-Date

Escribir ""
Escribir "  ==========================================================" "Cyan"
Escribir "   POS-iaDoS - RESPALDO COMPLETO" "Cyan"
Escribir "  ==========================================================" "Cyan"

$MYSQLDUMP   = Join-Path $InstallDir "mariadb\bin\mysqldump.exe"
$NODE        = Join-Path $InstallDir "node\node.exe"
$script:NSSM = Join-Path $InstallDir "tools\nssm.exe"
$ENV_BACKEND = Join-Path $InstallDir "backend\.env"
$UPLOADS     = Join-Path $InstallDir "backend\uploads"
$VERSION_JS  = Join-Path $InstallDir "version.json"
$NODE_TOOLS  = Join-Path $InstallDir "tools\node"
$SVC_BACKEND = "PosIaDos-Backend"

Titulo "[1/8] Revisando el equipo"

if (-not (Test-Path $InstallDir))   { Terminar 1 "No existe $InstallDir. Indica la ruta con -InstallDir." }
if (-not (Test-Path $ENV_BACKEND))  { Terminar 1 "No existe $ENV_BACKEND. No se puede leer la base de datos." }
if (-not (Test-Path $MYSQLDUMP))    { Terminar 1 "No existe $MYSQLDUMP. Este respaldo necesita la MariaDB empaquetada." }
Ok "Instalacion encontrada en $InstallDir"

$version = "desconocida"
if (Test-Path $VERSION_JS) {
    try { $version = (Get-Content $VERSION_JS -Raw -Encoding UTF8 | ConvertFrom-Json).version } catch { $version = "ilegible" }
}
Ok "Version instalada: $version"

$cfg = Leer-Env -Ruta $ENV_BACKEND
$dbHost = if ($cfg.DB_HOST) { $cfg.DB_HOST } else { "127.0.0.1" }
$dbPort = if ($cfg.DB_PORT) { $cfg.DB_PORT } else { "3306" }
$dbUser = if ($cfg.DB_USERNAME) { $cfg.DB_USERNAME } else { "pos_iados" }
$dbName = if ($cfg.DB_DATABASE) { $cfg.DB_DATABASE } else { "pos_iados" }
$dbPass = $cfg.DB_PASSWORD
if (-not $dbPass) { Terminar 1 "El .env no trae DB_PASSWORD. No se puede respaldar la base." }
Ok "Base de datos: $dbName en ${dbHost}:${dbPort} (usuario $dbUser)"

# --- espacio en disco: se calcula ANTES de empezar ---
$tamUploads = Tamano-Carpeta -Ruta $UPLOADS
$tamDatos   = Tamano-Carpeta -Ruta (Join-Path $InstallDir "mariadb\data")
# Margen: el .sql suele pesar menos que los datos de InnoDB, pero el Excel y la
# copia de uploads suman. Se pide el doble de lo estimado para no quedar corto.
$necesario  = ($tamUploads + $tamDatos) * 2 + 104857600
$unidad     = (Split-Path -Qualifier $InstallDir)
$libre      = 0
try {
    $libre = (Get-PSDrive -Name $unidad.TrimEnd(":")).Free
} catch {
    try { $libre = (Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$unidad'").FreeSpace } catch { $libre = 0 }
}
Escribir "        Uploads: $(Tamano-Legible $tamUploads)   Datos: $(Tamano-Legible $tamDatos)"
if ($libre -gt 0) {
    Escribir "        Libre en $unidad $(Tamano-Legible $libre)   se estiman $(Tamano-Legible $necesario)"
    if ($libre -lt $necesario) {
        Terminar 1 "No hay espacio suficiente en $unidad. Libera espacio o usa -Destino en otra unidad. No se toco nada."
    }
    Ok "Espacio suficiente"
} else {
    Aviso "No se pudo medir el espacio libre; se continua"
}

# =============================================================================
#  2. Carpeta del respaldo
# =============================================================================
Titulo "[2/8] Creando la carpeta del respaldo"

$sello = Get-Date -Format "yyyy-MM-dd_HHmm"
if ($Destino -ne "") {
    $carpeta = $Destino
} else {
    $carpeta = Join-Path $InstallDir "backups\$sello-$Etiqueta-v$version"
}
# Si ya existe una del mismo minuto y etiqueta, se agrega un sufijo en vez de
# escribir encima: un respaldo nunca sobrescribe a otro respaldo.
$base = $carpeta; $n = 2
while (Test-Path $carpeta) { $carpeta = "$base-$n"; $n++ }

New-Item -ItemType Directory -Path $carpeta -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $carpeta "config") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $carpeta "reportes") -Force | Out-Null

$script:LogPath = Join-Path $carpeta "respaldo.log"
Set-TextoSinBOM -Ruta $script:LogPath -Texto (($script:Lineas | Where-Object { $_ -ne $null }) -join "`r`n")
Ok "Carpeta: $carpeta"

# =============================================================================
#  3. Detener solo el backend
#     MariaDB SE QUEDA ARRIBA: mysqldump la necesita. Detener el backend evita
#     que entren ventas a medias mientras se vuelca.
# =============================================================================
Titulo "[3/8] Pausando el sistema"

$backendEstaba = $false
if (-not $NoDetenerServicio) {
    $svc = Get-Service -Name $SVC_BACKEND -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq "Running") {
        $backendEstaba = $true
        Servicio -Accion "stop" -Nombre $SVC_BACKEND
        Start-Sleep -Seconds 3
        Ok "Backend detenido (se vuelve a prender al final)"
    } elseif ($svc) {
        Aviso "El backend ya estaba detenido"
    } else {
        Aviso "No se encontro el servicio $SVC_BACKEND; se respalda igual"
    }
} else {
    Aviso "Se pidio no detener el servicio: el sistema sigue operando durante el respaldo"
}

# El dump se hace con --single-transaction, asi que la base queda consistente
# aunque alguien escriba. Igual se avisa en el reporte.

# =============================================================================
#  4. Volcado de la base de datos
# =============================================================================
Titulo "[4/8] Respaldando la base de datos"

$sqlPath = Join-Path $carpeta "base-datos.sql"
$cnf     = Join-Path $env:TEMP ("pos-dump-" + [guid]::NewGuid().ToString("N") + ".cnf")

$dumpOk = $false
try {
    # La contrasena viaja en este archivo y no en la linea de comandos.
    $contenidoCnf = "[client]`r`nuser=$dbUser`r`npassword=""$dbPass""`r`nhost=$dbHost`r`nport=$dbPort`r`n"
    Set-Content -Path $cnf -Value $contenidoCnf -Encoding ASCII -NoNewline

    $errPath = Join-Path $carpeta "reportes\mysqldump-errores.txt"
    $argumentos = @(
        "--defaults-extra-file=$cnf",
        "--single-transaction",
        "--routines", "--triggers", "--events",
        "--hex-blob",
        "--default-character-set=utf8mb4",
        "--add-drop-table",
        "--complete-insert",
        "--databases", $dbName
    )

    $p = Start-Process -FilePath $MYSQLDUMP -ArgumentList $argumentos `
            -RedirectStandardOutput $sqlPath -RedirectStandardError $errPath `
            -NoNewWindow -Wait -PassThru

    if ($p.ExitCode -ne 0) {
        Falla "mysqldump termino con codigo $($p.ExitCode)"
        if (Test-Path $errPath) {
            foreach ($l in (Get-Content $errPath | Select-Object -First 8)) { Escribir "        $l" }
        }
    } else {
        $dumpOk = $true
    }
} finally {
    if (Test-Path $cnf) { Remove-Item -Path $cnf -Force -ErrorAction SilentlyContinue }
}

if (-not $dumpOk) {
    if ($backendEstaba) { Servicio -Accion "start" -Nombre $SVC_BACKEND }
    Terminar 1 "El respaldo de la base FALLO. No se continua: un respaldo incompleto es peor que ninguno. El sistema se dejo como estaba."
}

# --- verificacion del volcado: no basta con que el archivo exista ---
$sqlInfo  = Get-Item $sqlPath
$cola     = Get-Content -Path $sqlPath -Tail 12 -Encoding UTF8
$completo = ($cola -join "`n") -match "Dump completed"
$tablasEnDump = (Select-String -Path $sqlPath -Pattern "^CREATE TABLE" -AllMatches).Count

if (-not $completo) {
    if ($backendEstaba) { Servicio -Accion "start" -Nombre $SVC_BACKEND }
    Terminar 1 "El volcado quedo cortado (no trae la marca de fin). No se continua. El sistema se dejo como estaba."
}
if ($sqlInfo.Length -lt 20480) {
    Aviso "El volcado pesa solo $(Tamano-Legible $sqlInfo.Length): revisa que la base tenga datos"
}
Ok "base-datos.sql  $(Tamano-Legible $sqlInfo.Length)  -  $tablasEnDump tablas  -  volcado completo"

$sqlHash = Huella -Ruta $sqlPath
if ($sqlHash) { Escribir "        SHA256 $($sqlHash.Substring(0,16))..." }

# =============================================================================
#  5. Imagenes y archivos subidos
# =============================================================================
Titulo "[5/8] Respaldando imagenes y archivos subidos"

$uploadsDestino = Join-Path $carpeta "uploads"
$archivosUploads = 0
if (Test-Path $UPLOADS) {
    # robocopy en vez de Copy-Item: con miles de imagenes es mas rapido y no se
    # cae por rutas largas.
    $logRobo = Join-Path $carpeta "reportes\uploads-copia.log"
    & robocopy $UPLOADS $uploadsDestino /E /R:2 /W:1 /NFL /NDL /NP /LOG:"$logRobo" | Out-Null
    $codigo = $LASTEXITCODE
    # robocopy: 0-7 es exito (8 o mas = archivos que no se pudieron copiar)
    if ($codigo -ge 8) {
        Falla "robocopy devolvio ${codigo}: hubo archivos que no se pudieron copiar. Ver $logRobo"
    }
    $archivosUploads = (Get-ChildItem -Path $uploadsDestino -Recurse -File -ErrorAction SilentlyContinue).Count
    $origenCuenta    = (Get-ChildItem -Path $UPLOADS -Recurse -File -ErrorAction SilentlyContinue).Count
    if ($archivosUploads -lt $origenCuenta) {
        Falla "Se copiaron $archivosUploads de $origenCuenta archivos. REVISAR antes de actualizar."
    } else {
        Ok "$archivosUploads archivos copiados  ($(Tamano-Legible (Tamano-Carpeta $uploadsDestino)))"
    }
} else {
    Aviso "No existe $UPLOADS todavia (no hay imagenes subidas)"
}

# uploads-builtin viene con el sistema, pero se respalda igual: pesa poco y
# evita preguntas despues.
$builtin = Join-Path $InstallDir "backend\uploads-builtin"
if (Test-Path $builtin) {
    & robocopy $builtin (Join-Path $carpeta "uploads-builtin") /E /R:1 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
    Ok "uploads-builtin tambien respaldado"
}

# =============================================================================
#  6. Configuracion y binarios actuales
# =============================================================================
Titulo "[6/8] Respaldando configuracion y programa"

$cfgDir = Join-Path $carpeta "config"
foreach ($par in @(
    @{ src = $ENV_BACKEND;  dst = "backend.env" },
    @{ src = $VERSION_JS;   dst = "version.json" },
    @{ src = (Join-Path $InstallDir "mariadb\my.ini"); dst = "my.ini" },
    @{ src = (Join-Path $InstallDir "CREDENCIALES.txt"); dst = "CREDENCIALES.txt" }
)) {
    if (Test-Path $par.src) {
        Copy-Item -Path $par.src -Destination (Join-Path $cfgDir $par.dst) -Force
        Ok "config\$($par.dst)"
    }
}

# El programa compilado: con esto se puede volver a la version anterior sin
# necesitar internet ni el instalador viejo.
$programa = Join-Path $carpeta "programa"
New-Item -ItemType Directory -Path $programa -Force | Out-Null
foreach ($nombre in @("dist", "public")) {
    $src = Join-Path $InstallDir "backend\$nombre"
    if (Test-Path $src) {
        & robocopy $src (Join-Path $programa $nombre) /E /R:1 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
        Ok "programa\$nombre  ($(Tamano-Legible (Tamano-Carpeta (Join-Path $programa $nombre))))"
    }
}
$distProd = Join-Path $InstallDir "frontend\dist-prod"
if (Test-Path $distProd) {
    & robocopy $distProd (Join-Path $programa "dist-prod") /E /R:1 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
    Ok "programa\dist-prod (pantallas)"
}

# Estructura de la base en texto: permite comparar el esquema antes y despues
# sin abrir el .sql completo.
try {
    $esquema = Select-String -Path $sqlPath -Pattern '^(CREATE TABLE|\s+`|\) ENGINE)' |
               ForEach-Object { $_.Line }
    Set-TextoSinBOM -Ruta (Join-Path $carpeta "reportes\esquema.txt") -Texto $esquema
    Ok "reportes\esquema.txt (estructura de las tablas)"
} catch {
    Aviso "No se pudo extraer el esquema del volcado"
}

# =============================================================================
#  7. Reportes: Excel, ajustes activos, inventario de imagenes
# =============================================================================
Titulo "[7/8] Generando reportes legibles"

$reportes = Join-Path $carpeta "reportes"
$nodeOk = (Test-Path $NODE) -and (Test-Path (Join-Path $NODE_TOOLS "comun.js"))
$excelOk = $false; $ajustesOk = $false; $imagenesOk = $false

if (-not $nodeOk) {
    Aviso "No se encontro el node empaquetado o las herramientas en $NODE_TOOLS"
    Aviso "El respaldo de la base y de las imagenes SI se hizo; faltan solo los reportes"
} else {
    # --- Excel con todo ---
    if (-not $SinExcel) {
        Escribir "        Exportando la base a Excel (puede tardar varios minutos)..."
        & $NODE (Join-Path $NODE_TOOLS "exportar-excel.js") --install-dir $InstallDir --salida $carpeta --archivo "datos-completos.xlsx" 2>&1 |
            ForEach-Object { Escribir "      $_" }
        if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $carpeta "datos-completos.xlsx"))) {
            $excelOk = $true
            Ok "datos-completos.xlsx  ($(Tamano-Legible (Get-Item (Join-Path $carpeta 'datos-completos.xlsx')).Length))"
        } else {
            Falla "No se pudo generar el Excel. El respaldo .sql no se ve afectado."
        }
    } else {
        Aviso "Excel omitido (-SinExcel)"
    }

    # --- ajustes activos ---
    & $NODE (Join-Path $NODE_TOOLS "ajustes.js") --install-dir $InstallDir --salida $reportes 2>&1 |
        ForEach-Object { Escribir "      $_" }
    if (Test-Path (Join-Path $reportes "ajustes.json")) {
        $ajustesOk = $true
        Ok "reportes\ajustes.json + AJUSTES.txt (lo que trae prendido hoy)"
    } else {
        Falla "No se pudo leer la configuracion activa"
    }

    # --- inventario de imagenes, sin tocar la base ---
    if (-not $SinImagenes) {
        & $NODE (Join-Path $NODE_TOOLS "imagenes.js") --install-dir $InstallDir --salida $reportes 2>&1 |
            ForEach-Object { Escribir "      $_" }
        if (Test-Path (Join-Path $reportes "imagenes.json")) {
            $imagenesOk = $true
            Ok "reportes\imagenes.json + IMAGENES.txt (estado de cada URL)"
        } else {
            Falla "No se pudo levantar el inventario de imagenes"
        }
    } else {
        Aviso "Inventario de imagenes omitido (-SinImagenes)"
    }
}

# =============================================================================
#  8. Manifiesto, resumen y arranque
# =============================================================================
Titulo "[8/8] Cerrando el respaldo"

$imgJson = $null
if ($imagenesOk) {
    try { $imgJson = Get-Content (Join-Path $reportes "imagenes.json") -Raw -Encoding UTF8 | ConvertFrom-Json } catch {}
}
$excelJson = $null
if ($excelOk) {
    try { $excelJson = Get-Content (Join-Path $carpeta "excel.json") -Raw -Encoding UTF8 | ConvertFrom-Json } catch {}
}

$manifest = [ordered]@{
    producto          = "POS-iaDoS"
    tipo              = "respaldo-completo"
    etiqueta          = $Etiqueta
    fecha             = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    version_respaldada = $version
    install_dir       = $InstallDir
    base_datos        = $dbName
    carpeta           = $carpeta
    base_sql          = [ordered]@{
        archivo = "base-datos.sql"
        bytes   = $sqlInfo.Length
        tablas  = $tablasEnDump
        sha256  = $sqlHash
        completo = $true
    }
    uploads           = [ordered]@{
        archivos = $archivosUploads
        bytes    = (Tamano-Carpeta -Ruta $uploadsDestino)
    }
    excel             = [ordered]@{
        generado = $excelOk
        filas    = if ($excelJson) { $excelJson.filas_exportadas } else { 0 }
        completo = if ($excelJson) { $excelJson.completo } else { $false }
    }
    ajustes_leidos    = $ajustesOk
    imagenes          = [ordered]@{
        inventario = $imagenesOk
        urls       = if ($imgJson) { $imgJson.total_urls } else { 0 }
        correctas  = if ($imgJson) { $imgJson.resumen.relativa_ok } else { 0 }
        externas   = if ($imgJson) { $imgJson.resumen.externa } else { 0 }
        con_host   = if ($imgJson) { $imgJson.resumen.absoluta_local } else { 0 }
        sin_archivo = if ($imgJson) { $imgJson.resumen.relativa_huerfana } else { 0 }
    }
    revertir_con      = "tools\revertir.ps1 -Respaldo ""$carpeta"""
}
$manifest | ConvertTo-Json -Depth 6 | ForEach-Object { Set-TextoSinBOM -Ruta (Join-Path $carpeta "manifest.json") -Texto $_ }
Ok "manifest.json"

# --- RESUMEN.txt: el archivo que se abre primero ---
$duracion = [int]((Get-Date) - $inicio).TotalSeconds
$Res = New-Object System.Collections.ArrayList
function R { param([string]$t = "") [void]$Res.Add($t) }

R "==============================================================="
R "  RESPALDO POS-iaDoS"
R "  $(Get-Date -Format 'dd/MM/yyyy HH:mm')   version respaldada: $version"
R "==============================================================="
R ""
R "  Carpeta:"
R "    $carpeta"
R ""
R "  QUE SE GUARDO"
R "    Base de datos     base-datos.sql   $(Tamano-Legible $sqlInfo.Length)  ($tablasEnDump tablas)"
R "    Imagenes          uploads\         $archivosUploads archivos"
R "    Configuracion     config\backend.env, version.json, my.ini"
R "    Programa          programa\dist, programa\public"
if ($excelOk)    { R "    Excel completo    datos-completos.xlsx" }
if ($ajustesOk)  { R "    Ajustes activos   reportes\AJUSTES.txt" }
if ($imagenesOk) { R "    Imagenes (URL)    reportes\IMAGENES.txt" }
R ""
if ($imgJson) {
    R "  ESTADO DE LAS IMAGENES"
    R "    URL en la base                        : $($imgJson.total_urls)"
    R "    Correctas (se ven sin internet)       : $($imgJson.resumen.relativa_ok)"
    R "    En internet (se pueden traer al equipo): $($imgJson.resumen.externa)"
    R "    Con host fijo (se pueden normalizar)  : $($imgJson.resumen.absoluta_local)"
    R "    Sin archivo en disco                  : $($imgJson.resumen.relativa_huerfana)"
    R "    Archivos en uploads                   : $($imgJson.archivos_en_disco)"
    R "    Detalle completo en reportes\IMAGENES.txt"
    R ""
}
R "  COMO REVERTIR  (devuelve el sistema a como estaba hoy)"
R "    Doble clic en REVERTIR.bat  y elegir este respaldo,"
R "    o desde PowerShell como administrador:"
R ""
R "      cd ""$InstallDir\tools"""
R "      .\revertir.ps1 -Respaldo ""$carpeta"""
R ""
R "  El revert devuelve la base, las imagenes, la configuracion y el"
R "  programa al estado exacto de este respaldo."
R ""
R "  Tardo $duracion segundos."
R "==============================================================="
Set-TextoSinBOM -Ruta (Join-Path $carpeta "RESUMEN.txt") -Texto ($Res -join "`r`n")
Ok "RESUMEN.txt"

# --- se vuelve a prender el backend ---
if ($backendEstaba) {
    Escribir ""
    Escribir "        Volviendo a prender el sistema..."
    Servicio -Accion "start" -Nombre $SVC_BACKEND

    $puerto = if ($cfg.APP_PORT) { [int]$cfg.APP_PORT } elseif ($cfg.PORT) { [int]$cfg.PORT } else { 3000 }   # el .env dice APP_PORT; PORT queda como alias por compatibilidad
    if (Esperar-Puerto -Puerto $puerto -Segundos 90) {
        Ok "Sistema operando de nuevo en el puerto $puerto"
    } else {
        Falla "El sistema no respondio en el puerto $puerto despues de 90 segundos"
        Escribir "        Revisa $InstallDir\logs\backend-error.log" "Yellow"
        Escribir "        El respaldo SI quedo completo en $carpeta" "Yellow"
    }
}

Escribir ""
Escribir "  ==========================================================" "Green"
Escribir "   RESPALDO COMPLETO" "Green"
Escribir "  ==========================================================" "Green"
Escribir ""
Escribir "   $carpeta" "White"
Escribir ""
Escribir "   Base: $(Tamano-Legible $sqlInfo.Length) ($tablasEnDump tablas)   Imagenes: $archivosUploads archivos" "Gray"
if ($imgJson) {
    Escribir "   URL de imagen revisadas: $($imgJson.total_urls)   correctas: $($imgJson.resumen.relativa_ok)" "Gray"
}
Escribir ""
Escribir "   Lee primero:  $carpeta\RESUMEN.txt" "Cyan"
Escribir "   Para volver atras:  .\revertir.ps1 -Respaldo ""$carpeta""" "Cyan"
Escribir ""
exit 0
