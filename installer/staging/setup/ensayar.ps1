# =============================================================================
#  POS-iaDoS - ENSAYO DE LA ACTUALIZACION
#
#  Prueba la version nueva contra una COPIA de la base del cliente, en otra
#  base de datos y en otro puerto, SIN DETENER el sistema que esta vendiendo.
#
#  Para que sirve: la version nueva migra el esquema sola al arrancar
#  (synchronize). Este script deja que lo haga sobre la copia y despues compara
#  tabla por tabla, columna por columna y fila por fila contra como estaba.
#  Si la version nueva se iba a llevar algo del cliente, se sabe AQUI y la
#  instalacion real nunca se toco.
#
#  Uso:
#    .\ensayar.ps1 -Paquete "C:\Users\...\POS-iaDoS-2.4.2"
#    .\ensayar.ps1 -Paquete "D:\paquete" -Respaldo "C:\POS-iaDoS\backups\2026-09-30_1200-manual-v2.4.1"
#    .\ensayar.ps1 -Paquete "D:\paquete" -Conservar        (deja la base de prueba para revisarla)
#
#  Codigos de salida:
#    0  el esquema queda identico            -> se puede actualizar
#    3  solo se agregaron tablas/columnas     -> se puede actualizar (lo normal)
#    2  SE PIERDEN DATOS o no arranco         -> NO actualizar
#    1  no se pudo ni ensayar (falta algo)    -> no se actualizo nada
#
#  Lo que este script NO hace nunca:
#    - no detiene el servicio del backend
#    - no escribe en la base de datos real
#    - no toca uploads, ni .env, ni archivos de la instalacion
#  Todo lo que hace es: leer, volcar a un .sql, y trabajar sobre una base
#  llamada pos_ensayo_* que se tira al final.
# =============================================================================
param(
    [string]$InstallDir  = "C:\POS-iaDoS",
    [Parameter(Mandatory = $true)]
    [string]$Paquete,
    [string]$Respaldo    = "",
    [string]$BaseEnsayo  = "",
    [int]$Puerto         = 0,
    [int]$EsperaSegundos = 300,
    [switch]$Conservar,
    [switch]$Silencioso
)

$ErrorActionPreference = "Stop"

# -----------------------------------------------------------------------------
#  Salida a pantalla y a archivo al mismo tiempo. El cliente opera en remoto y
#  sin supervision visual: el archivo es la unica evidencia.
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

function Puerto-Libre {
    param([int]$Desde = 3100)
    for ($p = $Desde; $p -lt ($Desde + 60); $p++) {
        $ocupado = $false
        try {
            $c = New-Object System.Net.Sockets.TcpClient
            $c.Connect("127.0.0.1", $p)
            $c.Close()
            $ocupado = $true
        } catch { $ocupado = $false }
        if (-not $ocupado) { return $p }
    }
    return 0
}

# -----------------------------------------------------------------------------
#  Estado que hay que limpiar pase lo que pase
# -----------------------------------------------------------------------------
$script:Carpeta      = $null
$script:ProcesoNode  = $null
$script:CnfTemp      = $null
$script:SqlLimpio    = $null
$script:BaseCreada   = $null
$script:ArgsMysql    = $null
$script:MYSQL        = $null

function Limpiar {
    # 1. matar el backend de prueba si quedo vivo
    if ($script:ProcesoNode) {
        try {
            $p = Get-Process -Id $script:ProcesoNode -ErrorAction SilentlyContinue
            if ($p) {
                Stop-Process -Id $script:ProcesoNode -Force -ErrorAction SilentlyContinue
                Escribir "        Backend de prueba detenido (PID $($script:ProcesoNode))"
            }
        } catch { }
        $script:ProcesoNode = $null
    }
    # 2. tirar la base de prueba
    if ($script:BaseCreada -and -not $Conservar -and $script:ArgsMysql) {
        try {
            $sqlDrop = Join-Path $env:TEMP ("pos-ensayo-drop-" + [guid]::NewGuid().ToString("N") + ".sql")
            Set-Content -Path $sqlDrop -Encoding ASCII -Value "DROP DATABASE IF EXISTS ``$($script:BaseCreada)``;`r`n"
            Start-Process -FilePath $script:MYSQL -ArgumentList $script:ArgsMysql `
                -RedirectStandardInput $sqlDrop -NoNewWindow -Wait | Out-Null
            Remove-Item -Path $sqlDrop -Force -ErrorAction SilentlyContinue
            Escribir "        Base de prueba $($script:BaseCreada) eliminada"
        } catch {
            Aviso "No se pudo eliminar la base de prueba $($script:BaseCreada). Borrala a mano si estorba."
        }
        $script:BaseCreada = $null
    }
    # 3. archivos temporales con credenciales adentro
    if ($script:CnfTemp -and (Test-Path $script:CnfTemp)) {
        Remove-Item -Path $script:CnfTemp -Force -ErrorAction SilentlyContinue
    }
    if ($script:SqlLimpio -and (Test-Path $script:SqlLimpio)) {
        Remove-Item -Path $script:SqlLimpio -Force -ErrorAction SilentlyContinue
    }
    # 4. variables de entorno de esta sesion
    foreach ($v in @("DB_HOST","DB_PORT","DB_USERNAME","DB_PASSWORD","DB_DATABASE",
                     "APP_PORT","APP_HOST","JWT_SECRET","INSTALL_MODE","NODE_ENV")) {
        Remove-Item -Path ("Env:" + $v) -ErrorAction SilentlyContinue
    }
}

function Terminar {
    param([int]$Codigo, [string]$Mensaje)
    Limpiar
    Escribir ""
    $color = if ($Codigo -eq 0 -or $Codigo -eq 3) { "Green" } else { "Red" }
    Escribir "  $Mensaje" $color
    Escribir ""
    exit $Codigo
}

# =============================================================================
#  1. Revisiones previas
# =============================================================================
Escribir ""
Escribir "  ==========================================================" "Cyan"
Escribir "   POS-iaDoS - ENSAYO DE LA ACTUALIZACION" "Cyan"
Escribir "  ==========================================================" "Cyan"
Escribir ""
Escribir "  El sistema sigue trabajando normal durante todo el ensayo."
Escribir "  No se detiene el servicio y no se escribe en la base real."

Titulo "[1/9] Revisando el equipo y el paquete"

$script:MYSQL = Join-Path $InstallDir "mariadb\bin\mysql.exe"
$MYSQLDUMP    = Join-Path $InstallDir "mariadb\bin\mysqldump.exe"
$NODE         = Join-Path $InstallDir "node\node.exe"
$ENV_BACKEND  = Join-Path $InstallDir "backend\.env"
$ESQUEMA_JS   = Join-Path $InstallDir "tools\node\esquema.js"
$RESPALDAR    = Join-Path $InstallDir "tools\respaldar.ps1"

if (-not (Test-Path $InstallDir))  { Terminar 1 "No existe $InstallDir. Indica la ruta con -InstallDir." }
if (-not (Test-Path $ENV_BACKEND)) { Terminar 1 "No existe $ENV_BACKEND. Sin eso no se puede leer la base." }
if (-not (Test-Path $script:MYSQL)){ Terminar 1 "No existe $($script:MYSQL). El ensayo necesita la MariaDB empaquetada." }
if (-not (Test-Path $MYSQLDUMP))   { Terminar 1 "No existe $MYSQLDUMP." }
if (-not (Test-Path $NODE))        { Terminar 1 "No existe $NODE." }
Ok "Instalacion encontrada en $InstallDir"

# --- el esquema.js puede venir del paquete nuevo o de la instalacion ---
if (-not (Test-Path $ESQUEMA_JS)) {
    $delPaquete = Join-Path $Paquete "setup\node\esquema.js"
    if (Test-Path $delPaquete) {
        $ESQUEMA_JS = $delPaquete
        Aviso "esquema.js se tomo del paquete nuevo (la instalacion de hoy no lo trae)"
    } else {
        Terminar 1 "No se encontro esquema.js ni en $InstallDir\tools\node ni en el paquete. No se puede comparar el esquema."
    }
}

# --- donde vive el backend nuevo dentro del paquete ---
$backendNuevo = $null
foreach ($rel in @("app\backend", "backend")) {
    $cand = Join-Path $Paquete $rel
    if (Test-Path (Join-Path $cand "dist\main.js")) { $backendNuevo = $cand; break }
}
if (-not $backendNuevo) {
    Terminar 1 "El paquete '$Paquete' no trae app\backend\dist\main.js. Esa no es la carpeta del paquete nuevo."
}
Ok "Backend nuevo: $backendNuevo"

$versionNueva = "desconocida"
foreach ($rel in @("version.json", "app\version.json")) {
    $vj = Join-Path $Paquete $rel
    if (Test-Path $vj) {
        try { $versionNueva = (Get-Content $vj -Raw | ConvertFrom-Json).version } catch { }
        if ($versionNueva -ne "desconocida") { break }
    }
}
$versionHoy = "desconocida"
$vjHoy = Join-Path $InstallDir "version.json"
if (Test-Path $vjHoy) { try { $versionHoy = (Get-Content $vjHoy -Raw | ConvertFrom-Json).version } catch { } }
Ok "Version instalada hoy: $versionHoy   ->   version del paquete: $versionNueva"

# --- node_modules: sin ellos el backend nuevo no arranca y seria un falso NO ---
$nmNuevo     = Join-Path $backendNuevo "node_modules"
$nmInstalado = Join-Path $InstallDir "backend\node_modules"
$rutaNodePath = $null
if (Test-Path (Join-Path $nmNuevo "@nestjs")) {
    Ok "El paquete trae sus propias dependencias"
} elseif (Test-Path (Join-Path $nmInstalado "@nestjs")) {
    $rutaNodePath = $nmInstalado
    Aviso "El paquete no trae node_modules: se usan los de la instalacion de hoy."
    Aviso "Si la version nueva agrego una libreria, el ensayo va a fallar por eso y no por los datos."
} else {
    Terminar 1 "No hay node_modules ni en el paquete ni en $InstallDir\backend. No se puede arrancar el backend nuevo."
}

# --- datos de conexion (nunca se imprimen) ---
$cfg = Leer-Env -Ruta $ENV_BACKEND
$dbHost = if ($cfg.DB_HOST)     { $cfg.DB_HOST }     else { "127.0.0.1" }
$dbPort = if ($cfg.DB_PORT)     { $cfg.DB_PORT }     else { "3306" }
$dbUser = if ($cfg.DB_USERNAME) { $cfg.DB_USERNAME } else { "pos_iados" }
$dbName = if ($cfg.DB_DATABASE) { $cfg.DB_DATABASE } else { "pos_iados" }
$dbPass = $cfg.DB_PASSWORD
if (-not $dbPass) { Terminar 1 "El .env no trae DB_PASSWORD." }
Ok "Base real: $dbName en ${dbHost}:${dbPort} (solo se LEE)"

if ($BaseEnsayo -eq "") {
    $BaseEnsayo = "pos_ensayo_" + (Get-Date -Format "MMdd_HHmm")
}
# Candado: la base de prueba JAMAS puede llamarse igual que la real.
if ($BaseEnsayo -eq $dbName) {
    Terminar 1 "La base de ensayo no puede llamarse igual que la real ($dbName). Usa -BaseEnsayo con otro nombre."
}
if ($BaseEnsayo -notmatch "^[A-Za-z0-9_]+$") {
    Terminar 1 "El nombre '$BaseEnsayo' no sirve como base de datos. Solo letras, numeros y guion bajo."
}
Ok "Base de prueba: $BaseEnsayo (se crea y se tira al final)"

if ($Puerto -eq 0) { $Puerto = Puerto-Libre -Desde 3100 }
if ($Puerto -eq 0) { Terminar 1 "No se encontro un puerto libre entre 3100 y 3160 para el backend de prueba." }
Ok "El backend de prueba va a escuchar en 127.0.0.1:$Puerto"

# =============================================================================
#  2. Carpeta del ensayo
# =============================================================================
Titulo "[2/9] Creando la carpeta del ensayo"

$sello = Get-Date -Format "yyyy-MM-dd_HHmm"
$script:Carpeta = Join-Path $InstallDir "backups\$sello-ensayo-v$versionNueva"
$base = $script:Carpeta; $n = 2
while (Test-Path $script:Carpeta) { $script:Carpeta = "$base-$n"; $n++ }
New-Item -ItemType Directory -Path $script:Carpeta -Force | Out-Null

$script:LogPath = Join-Path $script:Carpeta "ensayo.log"
Set-Content -Path $script:LogPath -Value (($script:Lineas | Where-Object { $_ -ne $null }) -join "`r`n") -Encoding UTF8
Ok "Carpeta: $($script:Carpeta)"

# =============================================================================
#  3. El volcado de donde sale la copia
# =============================================================================
Titulo "[3/9] Consiguiendo una copia de la base"

$sqlPath = $null

if ($Respaldo -ne "") {
    $cand = Join-Path $Respaldo "base-datos.sql"
    if (-not (Test-Path $cand)) {
        Terminar 1 "El respaldo '$Respaldo' no trae base-datos.sql. Quita -Respaldo para que el ensayo haga su propio volcado."
    }
    $sqlPath = $cand
    Ok "Se usa el volcado del respaldo: $(Tamano-Legible (Get-Item $sqlPath).Length)"
} else {
    # Volcado propio, con el sistema arriba. --single-transaction deja la base
    # consistente aunque entren ventas mientras se vuelca.
    Escribir "        Volcando la base sin detener nada... puede tardar varios minutos."
    $sqlPath = Join-Path $script:Carpeta "copia-base.sql"
    $script:CnfTemp = Join-Path $env:TEMP ("pos-ensayo-" + [guid]::NewGuid().ToString("N") + ".cnf")
    Set-Content -Path $script:CnfTemp -Encoding ASCII -NoNewline `
        -Value "[client]`r`nuser=$dbUser`r`npassword=""$dbPass""`r`nhost=$dbHost`r`nport=$dbPort`r`n"

    $errDump = Join-Path $script:Carpeta "mysqldump-errores.txt"
    # Sin --databases a proposito: asi el .sql NO trae 'CREATE DATABASE' ni
    # 'USE', y no hay manera de que se cargue en la base equivocada.
    $argsDump = @(
        "--defaults-extra-file=$($script:CnfTemp)",
        "--single-transaction",
        "--routines", "--triggers", "--events",
        "--hex-blob",
        "--default-character-set=utf8mb4",
        "--add-drop-table",
        "--complete-insert",
        $dbName
    )
    $pd = Start-Process -FilePath $MYSQLDUMP -ArgumentList $argsDump `
            -RedirectStandardOutput $sqlPath -RedirectStandardError $errDump `
            -NoNewWindow -Wait -PassThru
    if ($pd.ExitCode -ne 0) {
        Falla "mysqldump termino con codigo $($pd.ExitCode)"
        if (Test-Path $errDump) { foreach ($l in (Get-Content $errDump | Select-Object -First 8)) { Escribir "        $l" "Red" } }
        Terminar 1 "No se pudo sacar la copia. NADA se toco."
    }
    Ok "Copia lista: $(Tamano-Legible (Get-Item $sqlPath).Length)"
}

# =============================================================================
#  4. Limpiar el volcado: quitarle 'CREATE DATABASE' y 'USE'
#     Esto es lo mas importante del script. Un volcado hecho con --databases
#     trae adentro 'USE `pos_iados`', y si se cargara asi, se escribiria en la
#     base REAL del cliente en vez de en la copia. Aqui esas lineas se quitan
#     y despues se verifica que ya no quede ninguna.
# =============================================================================
Titulo "[4/9] Preparando la copia para que NO pueda tocar la base real"

$script:SqlLimpio = Join-Path $script:Carpeta "copia-limpia.sql"
$quitadas    = 0
$renombradas = 0
$patronCalificado = '^(\s*(?:INSERT\s+INTO|REPLACE\s+INTO|CREATE\s+TABLE|DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE|LOCK\s+TABLES))\s+`' +
                    [regex]::Escape($dbName) + '`\s*\.'
$lector = $null; $escritor = $null
try {
    $lector   = New-Object System.IO.StreamReader($sqlPath, [System.Text.Encoding]::UTF8)
    $escritor = New-Object System.IO.StreamWriter($script:SqlLimpio, $false, (New-Object System.Text.UTF8Encoding($false)))
    while ($null -ne ($linea = $lector.ReadLine())) {
        if ($linea -match '^\s*(USE\s|CREATE\s+DATABASE|DROP\s+DATABASE|ALTER\s+DATABASE)') {
            $quitadas++
            $escritor.WriteLine("-- quitado por el ensayo: $linea")
            continue
        }
        # Un volcado puede traer el nombre de la base pegado al de la tabla
        # (INSERT INTO `pos_iados`.`ventas`). Si lo dejaramos, esa linea
        # escribiria en produccion. Se le quita el nombre de la base.
        #
        # Se exige que este AL PRINCIPIO de la instruccion a proposito: dentro
        # de un INSERT, de la mitad en adelante son datos del cliente y ahi no
        # se toca ni un caracter.
        if ($linea -match $patronCalificado) {
            $linea = $linea -replace $patronCalificado, '$1 '
            $renombradas++
        }
        $escritor.WriteLine($linea)
    }
} finally {
    if ($escritor) { $escritor.Flush(); $escritor.Close() }
    if ($lector)   { $lector.Close() }
}
Ok "Instrucciones que cambiaban de base: $quitadas   nombres de tabla corregidos: $renombradas"

# --- verificacion: si quedo una sola, se aborta ---
$sobrevivientes = Select-String -Path $script:SqlLimpio -Pattern '^\s*(USE\s|CREATE\s+DATABASE|DROP\s+DATABASE)' -List
if ($sobrevivientes) {
    Terminar 1 "La copia todavia trae instrucciones que cambian de base de datos. Se aborta el ensayo por seguridad; la base real no se toco."
}
Ok "Verificado: la copia ya no puede cambiarse de base de datos"

# =============================================================================
#  5. Crear la base de prueba y cargar la copia
# =============================================================================
Titulo "[5/9] Cargando la copia en $BaseEnsayo"

if (-not $script:CnfTemp -or -not (Test-Path $script:CnfTemp)) {
    $script:CnfTemp = Join-Path $env:TEMP ("pos-ensayo-" + [guid]::NewGuid().ToString("N") + ".cnf")
    Set-Content -Path $script:CnfTemp -Encoding ASCII -NoNewline `
        -Value "[client]`r`nuser=$dbUser`r`npassword=""$dbPass""`r`nhost=$dbHost`r`nport=$dbPort`r`n"
}
$script:ArgsMysql = @("--defaults-extra-file=$($script:CnfTemp)")

# --- tablas que tiene la base real ANTES de todo: se vuelve a contar al final
#     para poder jurar que el ensayo no la toco ---
$tablasRealAntes = 0
try {
    $s = & $script:MYSQL "--defaults-extra-file=$($script:CnfTemp)" "-N" "-B" "-e" `
        "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$dbName' AND TABLE_TYPE='BASE TABLE'" 2>&1
    if ($s -match "(\d+)") { $tablasRealAntes = [int]$Matches[1] }
} catch { }
Escribir "        La base real tiene $tablasRealAntes tablas (se vuelve a revisar al final)"

$errPath = Join-Path $script:Carpeta "carga-errores.txt"
$sqlCrear = Join-Path $env:TEMP ("pos-ensayo-crear-" + [guid]::NewGuid().ToString("N") + ".sql")
Set-Content -Path $sqlCrear -Encoding ASCII `
    -Value "DROP DATABASE IF EXISTS ``$BaseEnsayo``;`r`nCREATE DATABASE ``$BaseEnsayo`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`r`n"
$pc = Start-Process -FilePath $script:MYSQL -ArgumentList $script:ArgsMysql `
        -RedirectStandardInput $sqlCrear -RedirectStandardError $errPath `
        -NoNewWindow -Wait -PassThru
Remove-Item -Path $sqlCrear -Force -ErrorAction SilentlyContinue
if ($pc.ExitCode -ne 0) {
    if (Test-Path $errPath) { foreach ($l in (Get-Content $errPath | Select-Object -First 6)) { Escribir "        $l" "Red" } }
    Terminar 1 "No se pudo crear la base de prueba. Puede que el usuario de la base no tenga permiso de CREATE DATABASE. La base real no se toco."
}
$script:BaseCreada = $BaseEnsayo
Ok "Base de prueba creada"

Escribir "        Cargando... esto es lo que mas tarda."
$pl = Start-Process -FilePath $script:MYSQL `
        -ArgumentList ($script:ArgsMysql + @("--default-character-set=utf8mb4", "--database=$BaseEnsayo")) `
        -RedirectStandardInput $script:SqlLimpio -RedirectStandardError $errPath `
        -NoNewWindow -Wait -PassThru
if ($pl.ExitCode -ne 0) {
    Falla "mysql termino con codigo $($pl.ExitCode)"
    if (Test-Path $errPath) { foreach ($l in (Get-Content $errPath | Select-Object -First 10)) { Escribir "        $l" "Red" } }
    Terminar 1 "No se pudo cargar la copia. La base real no se toco."
}
Ok "Copia cargada en $BaseEnsayo"

# =============================================================================
#  6. Foto del esquema ANTES de que la version nueva lo migre
# =============================================================================
Titulo "[6/9] Fotografiando el esquema de hoy"

$antesJson = Join-Path $script:Carpeta "esquema-antes.json"
$salidaEsq = Join-Path $script:Carpeta "esquema-captura.txt"
& $NODE $ESQUEMA_JS "--install-dir" $InstallDir "--base" $BaseEnsayo "--archivo" $antesJson *>&1 |
    Tee-Object -FilePath $salidaEsq | ForEach-Object { Escribir "        $_" }
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $antesJson)) {
    Terminar 1 "No se pudo fotografiar el esquema. Sin la foto de antes no hay con que comparar, asi que no se ensaya."
}
Ok "Foto de antes guardada"

# =============================================================================
#  7. Arrancar el backend NUEVO contra la copia
#     Las variables de entorno le ganan al .env (dotenv no sobrescribe lo que
#     ya existe en el entorno), asi que el backend nuevo va a la copia y al
#     puerto de prueba aunque el .env del paquete diga otra cosa.
# =============================================================================
Titulo "[7/9] Arrancando la version $versionNueva contra la copia"

$logBackend = Join-Path $script:Carpeta "backend-ensayo.log"
$errBackend = Join-Path $script:Carpeta "backend-ensayo-errores.log"

$env:DB_HOST      = $dbHost
$env:DB_PORT      = "$dbPort"
$env:DB_USERNAME  = $dbUser
$env:DB_PASSWORD  = $dbPass
$env:DB_DATABASE  = $BaseEnsayo
$env:APP_PORT     = "$Puerto"
$env:APP_HOST     = "127.0.0.1"
$env:NODE_ENV     = "production"
$env:INSTALL_MODE = "local"
# Secreto de juguete: este backend vive unos minutos, en localhost, contra una
# base desechable. No se usa el real para no dejarlo escrito en ningun lado.
$env:JWT_SECRET   = "ensayo-" + [guid]::NewGuid().ToString("N")
if ($rutaNodePath) { $env:NODE_PATH = $rutaNodePath }

$proc = Start-Process -FilePath $NODE -ArgumentList @("dist\main.js") `
            -WorkingDirectory $backendNuevo `
            -RedirectStandardOutput $logBackend -RedirectStandardError $errBackend `
            -NoNewWindow -PassThru
$script:ProcesoNode = $proc.Id
Ok "Arrancado (PID $($proc.Id)). Esperando hasta $EsperaSegundos segundos."

$arranco = $false
$murio   = $false
$fin = (Get-Date).AddSeconds($EsperaSegundos)
while ((Get-Date) -lt $fin) {
    if ($proc.HasExited) { $murio = $true; break }
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Puerto/api/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $arranco = $true; break }
    } catch { }
    Start-Sleep -Seconds 3
}

function Mostrar-Errores {
    Escribir ""
    Escribir "  Lo que dijo la version nueva al fallar:" "Yellow"
    foreach ($archivo in @($errBackend, $logBackend)) {
        if (-not (Test-Path $archivo)) { continue }
        $lineas = Get-Content $archivo -ErrorAction SilentlyContinue
        if (-not $lineas) { continue }
        # Primero lo que de verdad explica la falla; si no hay, las ultimas lineas.
        $claves = $lineas | Select-String -Pattern "QueryFailedError|ER_|Error:|Cannot|ECONNREFUSED|synchron|Nest can't resolve" |
                  Select-Object -First 12
        if ($claves) {
            foreach ($l in $claves) { Escribir "        $($l.Line)" "Red" }
        } else {
            foreach ($l in ($lineas | Select-Object -Last 10)) { Escribir "        $l" }
        }
    }
    Escribir ""
    Escribir "  Los dos archivos completos estan en:" "Yellow"
    Escribir "        $logBackend"
    Escribir "        $errBackend"
}

if ($murio) {
    Falla "La version nueva se cayo al arrancar (codigo $($proc.ExitCode))"
    Mostrar-Errores
    $rep = Join-Path $script:Carpeta "ENSAYO.txt"
    Set-Content -Path $rep -Encoding UTF8 -Value @"
POS-iaDoS - ENSAYO DE LA ACTUALIZACION
======================================

VEREDICTO: NO ACTUALIZAR

La version $versionNueva no logro arrancar ni contra una copia de la base.
Si se hubiera actualizado de verdad, el sistema se habria quedado abajo.

NO SE TOCO NADA: el sistema sigue en la version $versionHoy y operando.

Manda estos dos archivos:
  backend-ensayo-errores.log
  backend-ensayo.log

Carpeta del ensayo: $($script:Carpeta)
"@
    Copy-Item -Path $rep -Destination (Join-Path $InstallDir "ULTIMO-ENSAYO.txt") -Force -ErrorAction SilentlyContinue
    Terminar 2 "NO ACTUALIZAR: la version nueva no arranca. El sistema sigue trabajando igual."
}
if (-not $arranco) {
    Falla "Pasaron $EsperaSegundos segundos y la version nueva no respondio en /api/health"
    Mostrar-Errores
    Terminar 2 "NO ACTUALIZAR: la version nueva se queda colgada al arrancar. El sistema sigue trabajando igual."
}
Ok "La version nueva arranco y respondio /api/health"

# El esquema ya se migro solo durante el arranque. Un momento mas para que
# terminen los indices que TypeORM crea al final.
Start-Sleep -Seconds 5

# =============================================================================
#  8. Foto del esquema DESPUES y comparacion
# =============================================================================
Titulo "[8/9] Comparando que cambio"

$despuesJson = Join-Path $script:Carpeta "esquema-despues.json"
& $NODE $ESQUEMA_JS "--install-dir" $InstallDir "--base" $BaseEnsayo "--archivo" $despuesJson *>&1 |
    ForEach-Object { Escribir "        $_" }
if (-not (Test-Path $despuesJson)) {
    Terminar 2 "No se pudo fotografiar el esquema despues de migrar. Mejor no actualizar sin saber que cambio."
}

# Se apaga el backend de prueba antes de comparar: ya no hace falta y suelta
# la base.
Stop-Process -Id $script:ProcesoNode -Force -ErrorAction SilentlyContinue
$script:ProcesoNode = $null
Start-Sleep -Seconds 2

$reporteEsq = Join-Path $script:Carpeta "ESQUEMA.txt"
& $NODE $ESQUEMA_JS "--comparar" $antesJson "--contra" $despuesJson "--salida" $reporteEsq *>&1 |
    ForEach-Object { Escribir $_ }
$codigoEsq = $LASTEXITCODE

# =============================================================================
#  9. Revisar que la base real siguio intacta y escribir el reporte
# =============================================================================
Titulo "[9/9] Revisando que la base real no se toco"

$tablasRealDespues = -1
try {
    $s = & $script:MYSQL "--defaults-extra-file=$($script:CnfTemp)" "-N" "-B" "-e" `
        "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$dbName' AND TABLE_TYPE='BASE TABLE'" 2>&1
    if ($s -match "(\d+)") { $tablasRealDespues = [int]$Matches[1] }
} catch { }

$realIntacta = ($tablasRealDespues -eq $tablasRealAntes)
if ($realIntacta) {
    Ok "La base real sigue con $tablasRealDespues tablas: el ensayo no la toco"
} else {
    Falla "La base real tenia $tablasRealAntes tablas y ahora reporta $tablasRealDespues. REVISAR."
}

switch ($codigoEsq) {
    0 { $veredicto = "SE PUEDE ACTUALIZAR"; $detalle = "El esquema no cambia: la version nueva usa las mismas tablas." }
    3 { $veredicto = "SE PUEDE ACTUALIZAR"; $detalle = "Solo se agregan tablas o columnas nuevas. Nada del cliente desaparece." }
    2 { $veredicto = "NO ACTUALIZAR";       $detalle = "La version nueva PIERDE datos. Lee ESQUEMA.txt y mandalo." }
    default { $veredicto = "REVISAR";       $detalle = "La comparacion no termino bien (codigo $codigoEsq). Lee ESQUEMA.txt." }
}
if (-not $realIntacta) {
    $veredicto = "REVISAR"
    $detalle += " Ademas el conteo de tablas de la base real cambio durante el ensayo."
}

$reporte = Join-Path $script:Carpeta "ENSAYO.txt"
$lineasRep = @(
    "POS-iaDoS - ENSAYO DE LA ACTUALIZACION",
    "======================================",
    "",
    "VEREDICTO: $veredicto",
    "",
    $detalle,
    "",
    "Que se probo",
    "------------",
    "  Version instalada hoy : $versionHoy",
    "  Version del paquete   : $versionNueva",
    "  Paquete               : $Paquete",
    "  Copia de prueba       : $BaseEnsayo" + $(if ($Conservar) { " (se dejo para revisarla)" } else { " (ya se elimino)" }),
    "  Puerto de prueba      : 127.0.0.1:$Puerto",
    "  Terminado             : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "",
    "Que NO se toco",
    "--------------",
    "  El servicio del backend nunca se detuvo: el cliente siguio vendiendo.",
    "  La base real ($dbName) solo se leyo. Tablas antes: $tablasRealAntes, ahora: $tablasRealDespues.",
    "  No se tocaron las imagenes, ni el .env, ni ningun archivo de la instalacion.",
    "",
    "Archivos de este ensayo",
    "-----------------------",
    "  ESQUEMA.txt              la comparacion tabla por tabla (leelo si dice NO ACTUALIZAR)",
    "  esquema-antes.json       como estaba",
    "  esquema-despues.json     como quedaria",
    "  backend-ensayo.log       lo que dijo la version nueva al arrancar",
    "  ensayo.log               todo lo que hizo este script",
    "",
    "Carpeta: $($script:Carpeta)"
)
Set-Content -Path $reporte -Value ($lineasRep -join "`r`n") -Encoding UTF8
Copy-Item -Path $reporte -Destination (Join-Path $InstallDir "ULTIMO-ENSAYO.txt") -Force -ErrorAction SilentlyContinue

# El .sql de la copia pesa igual que la base: no tiene sentido guardarlo, el
# respaldo de verdad es el que hace respaldar.ps1.
if (-not $Conservar) {
    Remove-Item -Path $sqlPath -Force -ErrorAction SilentlyContinue
}

Escribir ""
Escribir "  ==========================================================" "Cyan"
Escribir "   $veredicto" $(if ($codigoEsq -eq 2) { "Red" } else { "Green" })
Escribir "  ==========================================================" "Cyan"
Escribir "  $detalle"
Escribir ""
Escribir "  Reporte: $reporte"
Escribir "           $InstallDir\ULTIMO-ENSAYO.txt"

if ($codigoEsq -eq 2 -or -not $realIntacta) {
    Terminar 2 "Ensayo terminado: NO actualizar todavia. El sistema sigue igual y trabajando."
}
Terminar $codigoEsq "Ensayo terminado: la actualizacion es segura. El sistema sigue igual."
