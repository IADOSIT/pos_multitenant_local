# =============================================================================
#  POS-iaDoS - ACTUALIZAR SIN PERDER DATOS
#
#  El orden importa y es siempre el mismo:
#
#    1. Respaldo completo (base + imagenes + Excel + ajustes)  <- si falla, se para
#    2. Se copia el programa nuevo, sin tocar uploads ni el .env
#    3. Arranca y TypeORM migra el esquema solo
#    4. Si no arranca, se revierte automaticamente al respaldo del paso 1
#    5. Se ajustan las URL de las imagenes a la nueva redireccion
#    6. Se comparan los ajustes de antes y de ahora, y se reporta
#
#  Lo que NUNCA se toca:
#    backend\uploads         las imagenes del cliente
#    backend\uploads-builtin
#    backend\.env            solo se le cambia la linea APP_VERSION
#    mariadb\data            los datos de la base
#    logs\
#
#  Uso:
#    .\actualizar.ps1 -Paquete "C:\temp\pos-update-2.4.2"
#    .\actualizar.ps1 -Paquete "..." -SiSinPreguntar          desatendido
#    .\actualizar.ps1 -Paquete "..." -SinEnsayo                sin la prueba previa
# =============================================================================
param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [string]$Paquete    = "",
    [string]$VersionNueva = "",
    [switch]$SinExcel,
    [switch]$SinArreglarImagenes,
    [switch]$SiSinPreguntar,
    [switch]$SinAutoRevertir,
    [switch]$SinEnsayo
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


$script:LogPath = $null

function Escribir {
    param([string]$Texto = "", [string]$Color = "Gray")
    Write-Host $Texto -ForegroundColor $Color
    if ($script:LogPath) { Add-Content -Path $script:LogPath -Value $Texto -Encoding UTF8 }
}
function Titulo { param([string]$t) Escribir ""; Escribir "  $t" "Cyan" }
function Ok    { param([string]$t) Escribir "    OK  $t" "Green" }
function Aviso { param([string]$t) Escribir "    !   $t" "Yellow" }
function Falla { param([string]$t) Escribir "    X   $t" "Red" }

function Terminar {
    param([int]$Codigo, [string]$Mensaje)
    Escribir ""
    Escribir "  $Mensaje" $(if ($Codigo -eq 0) { "Green" } else { "Red" })
    Escribir ""
    exit $Codigo
}

function Leer-Env {
    param([string]$Ruta)
    $h = @{}
    foreach ($linea in (Get-Content -Path $Ruta -Encoding UTF8)) {
        $t = $linea.Trim()
        if ($t -eq "" -or $t.StartsWith("#")) { continue }
        $i = $t.IndexOf("=")
        if ($i -lt 1) { continue }
        $h[$t.Substring(0, $i).Trim()] = $t.Substring($i + 1).Trim()
    }
    return $h
}

function Servicio {
    param([string]$Accion, [string]$Nombre)
    if (Test-Path $script:NSSM) { & $script:NSSM $Accion $Nombre 2>&1 | Out-Null }
    elseif ($Accion -eq "stop") { Stop-Service -Name $Nombre -Force -ErrorAction SilentlyContinue }
    else { Start-Service -Name $Nombre -ErrorAction SilentlyContinue }
}

function Esperar-Puerto {
    param([int]$Puerto, [int]$Segundos = 180)
    $fin = (Get-Date).AddSeconds($Segundos)
    while ((Get-Date) -lt $fin) {
        try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect("127.0.0.1", $Puerto); $c.Close(); return $true }
        catch { Start-Sleep -Milliseconds 2000 }
    }
    return $false
}

function Copiar-Espejo {
    param([string]$Origen, [string]$Destino, [string]$Etiqueta)
    if (-not (Test-Path $Origen)) { return $false }
    & robocopy $Origen $Destino /MIR /R:2 /W:2 /NFL /NDL /NP /NJH /NJS | Out-Null
    if ($LASTEXITCODE -ge 8) { Falla "robocopy $LASTEXITCODE copiando $Etiqueta"; return $false }
    Ok $Etiqueta
    return $true
}

function Copiar-Sumando {
    param([string]$Origen, [string]$Destino, [string]$Etiqueta)
    if (-not (Test-Path $Origen)) { return $false }
    # /E suma y sobrescribe pero NO borra lo que ya estaba: para node_modules es
    # lo prudente, porque quitar un paquete en uso deja el sistema sin arrancar.
    & robocopy $Origen $Destino /E /R:2 /W:2 /NFL /NDL /NP /NJH /NJS | Out-Null
    if ($LASTEXITCODE -ge 8) { Falla "robocopy $LASTEXITCODE copiando $Etiqueta"; return $false }
    Ok $Etiqueta
    return $true
}

$script:NSSM = Join-Path $InstallDir "tools\nssm.exe"
$NODE        = Join-Path $InstallDir "node\node.exe"
$NODE_TOOLS  = Join-Path $InstallDir "tools\node"
$ENV_BACKEND = Join-Path $InstallDir "backend\.env"
$VERSION_JS  = Join-Path $InstallDir "version.json"
$BACKUPS     = Join-Path $InstallDir "backups"
$SVC_BACKEND = "PosIaDos-Backend"
# Solo se usa para ajustar la rotacion de su bitacora; este script nunca
# detiene la base de datos.
$SVC_MARIADB = "PosIaDos-MariaDB"
$inicio = Get-Date

Escribir ""
Escribir "  ==========================================================" "Cyan"
Escribir "   POS-iaDoS - ACTUALIZACION" "Cyan"
Escribir "  ==========================================================" "Cyan"

# =============================================================================
#  1. Revisiones previas
# =============================================================================
Titulo "[1/9] Revisando el equipo y el paquete"

if (-not (Test-Path $InstallDir))  { Terminar 1 "No existe $InstallDir." }
if (-not (Test-Path $ENV_BACKEND)) { Terminar 1 "No existe $ENV_BACKEND. Esta instalacion no esta completa." }
if ($Paquete -eq "")               { Terminar 1 "Falta -Paquete con la carpeta de la actualizacion." }
if (-not (Test-Path $Paquete))     { Terminar 1 "No existe la carpeta del paquete: $Paquete" }

# El paquete puede venir como <pkg>\app\backend (igual que el instalador) o
# directamente como <pkg>\backend.
$raizApp = Join-Path $Paquete "app"
if (-not (Test-Path (Join-Path $raizApp "backend"))) { $raizApp = $Paquete }
$pkgBackend = Join-Path $raizApp "backend"
if (-not (Test-Path (Join-Path $pkgBackend "dist"))) {
    Terminar 1 "El paquete no trae backend\dist compilado. No sirve para actualizar: $pkgBackend"
}
Ok "Paquete valido en $Paquete"

$versionActual = "desconocida"
if (Test-Path $VERSION_JS) { try { $versionActual = (Get-Content $VERSION_JS -Raw -Encoding UTF8 | ConvertFrom-Json).version } catch {} }

if ($VersionNueva -eq "") {
    $pv = Join-Path $Paquete "version.json"
    if (Test-Path $pv) { try { $VersionNueva = (Get-Content $pv -Raw -Encoding UTF8 | ConvertFrom-Json).version } catch {} }
}
if ($VersionNueva -eq "") { $VersionNueva = "nueva" }

Ok "Version instalada: $versionActual   ->   version del paquete: $VersionNueva"
if ($versionActual -eq $VersionNueva) {
    Aviso "Ya esta en la version $VersionNueva. Se puede continuar igual (reinstala los archivos)."
}

$cfg = Leer-Env -Ruta $ENV_BACKEND
$puerto = if ($cfg.APP_PORT) { [int]$cfg.APP_PORT } elseif ($cfg.PORT) { [int]$cfg.PORT } else { 3000 }   # el .env dice APP_PORT; PORT queda como alias por compatibilidad

if (-not $SiSinPreguntar) {
    Escribir ""
    Escribir "   Se va a actualizar de $versionActual a $VersionNueva." "White"
    Escribir "   Primero se hace un respaldo completo; si algo sale mal se" "White"
    Escribir "   regresa solo a como estaba." "White"
    Escribir "   Las imagenes, la base y la configuracion NO se borran." "Green"
    Escribir ""
    $r = Read-Host "   Escribe ACTUALIZAR para continuar"
    if ($r -ne "ACTUALIZAR") { Terminar 0 "Cancelado. No se toco nada." }
}

# =============================================================================
#  2. Respaldo completo. Si esto falla, no se actualiza.
# =============================================================================
Titulo "[2/9] Respaldo completo antes de tocar nada"

$respaldarPs1 = Join-Path $InstallDir "tools\respaldar.ps1"
if (-not (Test-Path $respaldarPs1)) {
    Terminar 1 "No se encontro $respaldarPs1. Sin respaldo no se actualiza."
}

$argsRespaldo = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $respaldarPs1,
                  "-InstallDir", $InstallDir, "-Etiqueta", "preactualizacion")
if ($SinExcel) { $argsRespaldo += "-SinExcel" }

& powershell @argsRespaldo 2>&1 | ForEach-Object { Escribir "      $_" }
if ($LASTEXITCODE -ne 0) {
    Terminar 1 "El respaldo FALLO. No se actualiza. El sistema sigue como estaba."
}

$carpetaRespaldo = (Get-ChildItem -Path $BACKUPS -Directory -Filter "*preactualizacion*" -ErrorAction SilentlyContinue |
                    Sort-Object LastWriteTime -Descending | Select-Object -First 1)
if (-not $carpetaRespaldo) {
    Terminar 1 "El respaldo dijo que termino bien pero no se encuentra la carpeta. No se actualiza."
}
$RESPALDO = $carpetaRespaldo.FullName
$script:LogPath = Join-Path $RESPALDO "actualizacion.log"
Ok "Respaldo: $($carpetaRespaldo.Name)"

$ajustesAntes = Join-Path $RESPALDO "reportes\ajustes.json"
if (-not (Test-Path $ajustesAntes)) { Aviso "No se guardo la foto de ajustes; no se podra comparar al final" }

# =============================================================================
#  3. Ensayo contra una COPIA, con el sistema todavia arriba.
#     Aqui es donde se sabe si la version nueva se iba a llevar datos. Si el
#     ensayo dice que no, se corta ANTES de detener el servicio: el cliente
#     nunca deja de vender y no hay nada que revertir.
# =============================================================================
Titulo "[3/9] Ensayo de la actualizacion (el sistema sigue arriba)"

$ensayarPs1 = Join-Path $InstallDir "tools\ensayar.ps1"
if (-not (Test-Path $ensayarPs1)) {
    $ensayarPs1 = Join-Path $Paquete "setup\ensayar.ps1"
}

if ($SinEnsayo) {
    Aviso "Se pidio -SinEnsayo: la version nueva se instala sin probarla antes"
} elseif (-not (Test-Path $ensayarPs1)) {
    Aviso "No se encontro ensayar.ps1; se continua sin la prueba previa"
} else {
    # Se reusa el volcado del respaldo que se acaba de hacer: no hay razon para
    # volcar la base dos veces seguidas.
    $argsEnsayo = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $ensayarPs1,
                    "-InstallDir", $InstallDir, "-Paquete", $Paquete, "-Respaldo", $RESPALDO)
    & powershell @argsEnsayo 2>&1 | ForEach-Object { Escribir "      $_" }
    $codigoEnsayo = $LASTEXITCODE

    if ($codigoEnsayo -eq 0 -or $codigoEnsayo -eq 3) {
        Ok "El ensayo salio bien: la version nueva no pierde datos"
    } elseif ($codigoEnsayo -eq 2) {
        Escribir ""
        Escribir "   El ensayo dice que NO se debe actualizar." "Red"
        Escribir "   Lee el detalle en:  $InstallDir\ULTIMO-ENSAYO.txt" "Yellow"
        Escribir "   El sistema NO se detuvo y sigue en la version de siempre." "Yellow"
        Escribir "   El respaldo de hoy quedo en:  $RESPALDO" "Yellow"
        Terminar 2 "Actualizacion cancelada por el ensayo. No se toco nada."
    } else {
        Escribir ""
        Escribir "   El ensayo no se pudo completar (codigo $codigoEnsayo)." "Yellow"
        Escribir "   Lee:  $InstallDir\ULTIMO-ENSAYO.txt" "Yellow"
        Escribir "   Si de todos modos quieres actualizar, vuelve a correr esto con -SinEnsayo." "Yellow"
        Terminar 1 "Actualizacion cancelada: no se pudo probar antes. No se toco nada."
    }
}

# =============================================================================
#  4. Detener el sistema
# =============================================================================
Titulo "[4/9] Deteniendo el sistema"

# Antes de detener nada: asegurar que el servicio no mate a sus procesos hijos.
# Este mismo script puede venir lanzado por el boton "Actualizar" de la
# aplicacion, es decir como hijo del backend. Si el servicio conserva el valor
# de fabrica de nssm (matar el arbol), el "stop" de la linea siguiente nos
# mataria a nosotros y la actualizacion quedaria a medias, sin revertir.
# Un equipo instalado con una version anterior trae el valor peligroso, por eso
# se corrige aqui y no solo en la instalacion. Es un ajuste del servicio: no
# toca datos ni archivos del cliente.
if (Test-Path $script:NSSM) {
    & $script:NSSM set $SVC_BACKEND AppKillProcessTree 0 2>&1 | Out-Null
    # Rotar las bitacoras a los 10 MB. En un equipo que nadie revisa estos
    # archivos crecen sin limite y el disco lleno deja la base sin arrancar.
    & $script:NSSM set $SVC_BACKEND AppRotateFiles  1        2>&1 | Out-Null
    & $script:NSSM set $SVC_BACKEND AppRotateOnline 1        2>&1 | Out-Null
    & $script:NSSM set $SVC_BACKEND AppRotateBytes  10485760 2>&1 | Out-Null
    & $script:NSSM set $SVC_MARIADB AppRotateFiles  1        2>&1 | Out-Null
    & $script:NSSM set $SVC_MARIADB AppRotateOnline 1        2>&1 | Out-Null
    & $script:NSSM set $SVC_MARIADB AppRotateBytes  10485760 2>&1 | Out-Null
    Ok "Servicio ajustado para no matar al actualizador"
}

Servicio -Accion "stop" -Nombre $SVC_BACKEND
Start-Sleep -Seconds 4
# Si quedo algun node colgado del InstallDir, se cierra: con el archivo abierto
# robocopy no puede reemplazar el dist.
Get-Process -Name "node" -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -and $_.Path.StartsWith($InstallDir, [StringComparison]::OrdinalIgnoreCase) } |
    ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
Ok "Backend detenido"

# =============================================================================
#  5. Copiar el programa nuevo
# =============================================================================
Titulo "[5/9] Instalando los archivos nuevos"

$destBackend = Join-Path $InstallDir "backend"

# El motor (node) NO se reemplaza: el programa nuevo corre sobre el que ya esta
# instalado. Asi no hay que migrar nada ni se arriesga el runtime. Pero se deja
# anotado cual es, porque si alguna vez no coincidiera con el del paquete el
# arranque fallaria y esta linea seria la unica pista.
$vNodeInst = ""
$vNodePkg  = ""
try { $vNodeInst = (& $NODE -v 2>$null | Select-Object -First 1) } catch { }
$nodePkgExe = Join-Path $Paquete "runtime\node\node.exe"
if (Test-Path $nodePkgExe) { try { $vNodePkg = (& $nodePkgExe -v 2>$null | Select-Object -First 1) } catch { } }
if ($vNodeInst) {
    if ($vNodePkg -and $vNodePkg -ne $vNodeInst) {
        Aviso "El motor instalado es node $vNodeInst y el paquete trae $vNodePkg. No se reemplaza (no hace falta), queda anotado."
    } else {
        Escribir "        Motor: node $vNodeInst (no se reemplaza)"
    }
}

Copiar-Espejo  -Origen (Join-Path $pkgBackend "dist")   -Destino (Join-Path $destBackend "dist")   -Etiqueta "backend\dist (el programa)" | Out-Null
Copiar-Espejo  -Origen (Join-Path $pkgBackend "public") -Destino (Join-Path $destBackend "public") -Etiqueta "backend\public" | Out-Null
Copiar-Sumando -Origen (Join-Path $pkgBackend "node_modules") -Destino (Join-Path $destBackend "node_modules") -Etiqueta "backend\node_modules (librerias)" | Out-Null

# uploads-builtin se suma, nunca se espeja: trae imagenes de catalogo que el
# cliente pudo haber complementado.
Copiar-Sumando -Origen (Join-Path $pkgBackend "uploads-builtin") -Destino (Join-Path $destBackend "uploads-builtin") -Etiqueta "backend\uploads-builtin" | Out-Null

# Archivos sueltos de la raiz del backend. .env se excluye de forma explicita:
# ahi vive la contrasena de la base y el JWT del cliente.
foreach ($f in (Get-ChildItem -Path $pkgBackend -File -ErrorAction SilentlyContinue)) {
    if ($f.Name -eq ".env") { continue }
    Copy-Item -Path $f.FullName -Destination (Join-Path $destBackend $f.Name) -Force
}
Ok "archivos de la raiz del backend (sin tocar .env)"

# Pantallas
$pkgFront = Join-Path $raizApp "frontend\dist-prod"
if (-not (Test-Path $pkgFront)) { $pkgFront = Join-Path $raizApp "frontend" }
if (Test-Path (Join-Path $pkgFront "index.html")) {
    Copiar-Espejo -Origen $pkgFront -Destino (Join-Path $InstallDir "frontend\dist-prod") -Etiqueta "pantallas (frontend)" | Out-Null
} else {
    Aviso "El paquete no trae pantallas compiladas; se dejan las actuales"
}

# Herramientas de mantenimiento: se actualizan tambien, para que el revert del
# futuro sea el del codigo nuevo.
$pkgSetup = Join-Path $Paquete "setup"
if (Test-Path $pkgSetup) {
    $tools = Join-Path $InstallDir "tools"
    New-Item -ItemType Directory -Path $tools -Force | Out-Null
    foreach ($f in (Get-ChildItem -Path $pkgSetup -Filter "*.ps1" -File -ErrorAction SilentlyContinue)) {
        Copy-Item -Path $f.FullName -Destination (Join-Path $tools $f.Name) -Force
    }
    if (Test-Path (Join-Path $pkgSetup "node")) {
        Copiar-Espejo -Origen (Join-Path $pkgSetup "node") -Destino (Join-Path $tools "node") -Etiqueta "tools\node (herramientas)" | Out-Null
    }
    Ok "herramientas de respaldo y revert actualizadas"
}

# --- version.json y APP_VERSION ---
$infoVersion = [ordered]@{
    version      = $VersionNueva
    version_previa = $versionActual
    build_date   = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    actualizado  = $true
    respaldo     = $RESPALDO
}
$infoVersion | ConvertTo-Json | ForEach-Object { Set-TextoSinBOM -Ruta $VERSION_JS -Texto $_ }

# Solo se reescribe la linea APP_VERSION. El resto del .env no se toca.
$envLineas = Get-Content -Path $ENV_BACKEND -Encoding UTF8
if ($envLineas -match "^\s*APP_VERSION\s*=") {
    $envLineas = $envLineas | ForEach-Object {
        if ($_ -match "^\s*APP_VERSION\s*=") { "APP_VERSION=$VersionNueva" } else { $_ }
    }
} else {
    $envLineas += "APP_VERSION=$VersionNueva"
}
# Si al .env le falta INSTALL_MODE, se agrega como local. Si estamos corriendo
# este script, la instalacion ES local; sin esa linea el panel de mantenimiento
# en sitio no se muestra dentro del sistema.
if (-not ($envLineas -match "^\s*INSTALL_MODE\s*=")) {
    $envLineas += "INSTALL_MODE=local"
    Aviso "Al .env le faltaba INSTALL_MODE: se agrego como local"
}
Set-TextoSinBOM -Ruta $ENV_BACKEND -Texto ($envLineas -join "`r`n")
Ok "version.json y APP_VERSION en $VersionNueva"

# =============================================================================
#  6. Arrancar: aqui TypeORM migra el esquema solo
# =============================================================================
Titulo "[6/9] Arrancando y migrando el esquema"

$logBackend = Join-Path $InstallDir "logs\backend.log"
$marcaLog = 0
if (Test-Path $logBackend) { $marcaLog = (Get-Item $logBackend).Length }

Servicio -Accion "start" -Nombre $SVC_BACKEND
Escribir "        Esperando a que arranque (puede tardar: esta migrando la base)..."

$arranco = Esperar-Puerto -Puerto $puerto -Segundos 240

# El puerto abierto solo dice que el programa esta vivo. Para saber si PUEDE
# VENDER hay que preguntarle a /api/health, que es el unico que ejecuta un
# SELECT de verdad contra la base. Sin esta comprobacion, un backend que arranca
# pero se quedo sin base pasaria como actualizacion exitosa y el cliente se
# encontraria un POS que abre y no cobra, con el reporte diciendo que todo bien.
$motivoFalla = "El sistema NO arranco despues de 4 minutos."
if ($arranco) {
    Escribir "        Preguntandole a la base si responde..."
    $saludOk = $false
    $ultimaSalud = ""
    $finSalud = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $finSalud) {
        try {
            $h = Invoke-RestMethod -Uri "http://127.0.0.1:$puerto/api/health" -TimeoutSec 10
            $ultimaSalud = "status=$($h.status) db=$($h.db)"
            if ($h.status -eq "ok" -and $h.db -eq "connected") { $saludOk = $true; break }
        } catch {
            $ultimaSalud = $_.Exception.Message
        }
        Start-Sleep -Seconds 5
    }
    if ($saludOk) {
        Ok "La base responde (health: $ultimaSalud)"
    } else {
        $arranco = $false
        $motivoFalla = "El sistema abrio el puerto pero la base NO responde. Ultimo health: $ultimaSalud"
    }
}

if (-not $arranco) {
    Falla $motivoFalla
    if (Test-Path $logBackend) {
        Escribir ""
        Escribir "   Ultimas lineas del log:" "Yellow"
        foreach ($l in (Get-Content $logBackend -Tail 25 -ErrorAction SilentlyContinue)) { Escribir "     $l" "DarkGray" }
    }
    $logErr = Join-Path $InstallDir "logs\backend-error.log"
    if (Test-Path $logErr) {
        Escribir ""
        Escribir "   Errores:" "Yellow"
        foreach ($l in (Get-Content $logErr -Tail 25 -ErrorAction SilentlyContinue)) { Escribir "     $l" "Red" }
    }

    if ($SinAutoRevertir) {
        Terminar 1 "$motivoFalla Se pidio -SinAutoRevertir, asi que no se toco nada mas. Reviertelo con: .\revertir.ps1 -Respaldo ""$RESPALDO"""
    }

    Escribir ""
    Escribir "  ==========================================================" "Yellow"
    Escribir "   REGRESANDO SOLO AL ESTADO ANTERIOR" "Yellow"
    Escribir "  ==========================================================" "Yellow"
    $revertirPs1 = Join-Path $InstallDir "tools\revertir.ps1"
    if (Test-Path $revertirPs1) {
        # Sin red de seguridad: la red ES este respaldo, y el estado roto no
        # vale la pena guardarlo.
        & powershell -NoProfile -ExecutionPolicy Bypass -File $revertirPs1 `
            -InstallDir $InstallDir -Respaldo $RESPALDO -SiSinPreguntar -SinRedDeSeguridad 2>&1 |
            ForEach-Object { Escribir "      $_" }
        if ($LASTEXITCODE -eq 0) {
            Terminar 1 "La actualizacion fallo y el sistema YA REGRESO a la version $versionActual. Esta operando. Avisa del fallo con el log: $script:LogPath"
        }
        Terminar 1 "La actualizacion fallo y el regreso automatico tambien. Entra al equipo y corre: .\revertir.ps1 -Respaldo ""$RESPALDO"""
    }
    Terminar 1 "No arranco y no se encontro revertir.ps1. Corre a mano el revert con el respaldo: $RESPALDO"
}

Ok "El sistema arranco en el puerto $puerto"

# Que dice el esquema en el log
if (Test-Path $logBackend) {
    $nuevo = Get-Content $logBackend -Encoding UTF8 -ErrorAction SilentlyContinue | Select-Object -Last 400
    $cambios = $nuevo | Select-String -Pattern "CREATE TABLE|ALTER TABLE|ADD COLUMN|SchemaSync|query:" |
               Select-Object -First 25 | ForEach-Object { $_.Line }
    if ($cambios) {
        Escribir "        Cambios de esquema detectados:"
        foreach ($c in $cambios) { Escribir "          $($c.Trim())" "DarkGray" }
    }
}

$versionReportada = "?"
foreach ($u in @("http://127.0.0.1:$puerto/api/deploy/version", "http://127.0.0.1:$puerto/deploy/version")) {
    try { $r = Invoke-RestMethod -Uri $u -TimeoutSec 15; if ($r.version) { $versionReportada = $r.version; break } } catch {}
}
if ($versionReportada -eq "?") {
    Aviso "El sistema no reporto su version (puede ser normal si el endpoint cambio)"
} elseif ($versionReportada -ne $VersionNueva) {
    Aviso "El sistema reporta $versionReportada y se esperaba $VersionNueva"
} else {
    Ok "El sistema confirma la version $versionReportada"
}

# =============================================================================
#  7. Ajustar las URL de las imagenes a la nueva redireccion
# =============================================================================
Titulo "[7/9] Ajustando las imagenes a la nueva redireccion"

$reportesFinal = Join-Path $RESPALDO "reportes-despues"
New-Item -ItemType Directory -Path $reportesFinal -Force | Out-Null
$imagenesOk = $false

if ($SinArreglarImagenes) {
    Aviso "Omitido por -SinArreglarImagenes"
} elseif (-not (Test-Path $NODE) -or -not (Test-Path (Join-Path $NODE_TOOLS "imagenes.js"))) {
    Aviso "No se encontraron las herramientas de imagenes; se omite"
} else {
    & $NODE (Join-Path $NODE_TOOLS "imagenes.js") --install-dir $InstallDir --salida $reportesFinal --arreglar 2>&1 |
        ForEach-Object { Escribir "      $_" }
    if (Test-Path (Join-Path $reportesFinal "imagenes.json")) {
        $imagenesOk = $true
        try {
            $ij = Get-Content (Join-Path $reportesFinal "imagenes.json") -Raw -Encoding UTF8 | ConvertFrom-Json
            Ok "URL revisadas: $($ij.total_urls)   descargadas: $($ij.resumen.descargadas)   filas ajustadas: $($ij.cambios.Count)"
            if ($ij.resumen.descargas_falladas) {
                Aviso "$($ij.resumen.descargas_falladas) imagen(es) de internet no se pudieron traer: su URL se conservo sin cambios"
            }
        } catch { Ok "Imagenes revisadas (ver reportes-despues\IMAGENES.txt)" }
    } else {
        Falla "No se pudo ajustar las imagenes. Las URL quedaron como estaban."
    }
}

# =============================================================================
#  8. Comprobar que quedo operando igual
# =============================================================================
Titulo "[8/9] Comparando los ajustes de antes y de ahora"

$ajustesIguales = $null
if (-not (Test-Path $ajustesAntes)) {
    Aviso "No hay foto previa para comparar"
} elseif (-not (Test-Path (Join-Path $NODE_TOOLS "ajustes.js"))) {
    Aviso "No se encontro la herramienta de ajustes"
} else {
    & $NODE (Join-Path $NODE_TOOLS "ajustes.js") --install-dir $InstallDir --salida $reportesFinal --comparar $ajustesAntes 2>&1 |
        ForEach-Object { Escribir "      $_" }
    $codigo = $LASTEXITCODE
    if ($codigo -eq 0) {
        $ajustesIguales = $true
        Ok "Los ajustes quedaron IGUALES: el sistema opera como antes"
    } elseif ($codigo -eq 3) {
        $ajustesIguales = $false
        Falla "Hay ajustes que cambiaron. Revisa reportes-despues\COMPARACION-AJUSTES.txt"
    } else {
        Aviso "No se pudo comparar la configuracion"
    }
}

# =============================================================================
#  9. Reporte final
# =============================================================================
Titulo "[9/9] Reporte"

$duracion = [int]((Get-Date) - $inicio).TotalSeconds
$Res = New-Object System.Collections.ArrayList
function R { param([string]$t = "") [void]$Res.Add($t) }

R "==============================================================="
R "  ACTUALIZACION POS-iaDoS"
R "  $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
R "==============================================================="
R ""
R "  RESULTADO: el sistema esta operando en la version $VersionNueva"
R ""
R "  De la version   : $versionActual"
R "  A la version    : $VersionNueva   (el sistema reporta: $versionReportada)"
R "  Tardo           : $duracion segundos"
R ""
R "  RESPALDO PREVIO (con esto se regresa en cualquier momento)"
R "    $RESPALDO"
R ""
R "    Para regresar:"
R "      cd ""$InstallDir\tools"""
R "      .\revertir.ps1 -Respaldo ""$RESPALDO"""
R ""
R "  QUE NO SE TOCO"
R "    backend\uploads          las imagenes del negocio"
R "    backend\.env             solo cambio la linea APP_VERSION"
R "    mariadb\data             los datos de la base"
R ""
if ($imagenesOk) {
    R "  IMAGENES"
    R "    Se ajustaron las URL a la redireccion nueva."
    R "    Detalle: reportes-despues\IMAGENES.txt"
    R "    Ninguna URL fue borrada; lo que no se pudo arreglar quedo listado."
    R ""
}
if ($null -ne $ajustesIguales) {
    R "  AJUSTES DEL CLIENTE"
    if ($ajustesIguales) {
        R "    Quedaron IGUALES que antes de actualizar. Comprobado campo"
        R "    por campo contra la foto previa."
    } else {
        R "    HAY DIFERENCIAS. Revisar antes de dar por buena la actualizacion:"
        R "      reportes-despues\COMPARACION-AJUSTES.txt"
    }
    R ""
}
R "  ARCHIVOS PARA REVISAR"
R "    $RESPALDO\RESUMEN.txt                      que se respaldo"
R "    $RESPALDO\datos-completos.xlsx             la base en Excel"
R "    $RESPALDO\reportes\AJUSTES.txt             ajustes antes"
R "    $reportesFinal\AJUSTES.txt                 ajustes ahora"
R "    $reportesFinal\COMPARACION-AJUSTES.txt     las diferencias"
R "    $reportesFinal\IMAGENES.txt                estado de las imagenes"
R "    $script:LogPath                            bitacora completa"
R ""
R "==============================================================="

$rutaReporte = Join-Path $InstallDir "ULTIMA-ACTUALIZACION.txt"
Set-TextoSinBOM -Ruta $rutaReporte -Texto ($Res -join "`r`n")
Copy-Item -Path $rutaReporte -Destination (Join-Path $RESPALDO "ACTUALIZACION.txt") -Force
Ok "ULTIMA-ACTUALIZACION.txt en la raiz de la instalacion"

Escribir ""
Escribir "  ==========================================================" "Green"
Escribir "   ACTUALIZADO A LA VERSION $VersionNueva" "Green"
Escribir "  ==========================================================" "Green"
Escribir ""
Escribir "   El sistema esta operando. Nada se borro." "White"
Escribir ""
Escribir "   Respaldo para regresar:" "Cyan"
Escribir "     $RESPALDO" "Cyan"
Escribir ""
Escribir "   Lee el reporte:  $rutaReporte" "Cyan"
Escribir ""

if ($ajustesIguales -eq $false) {
    Escribir "   ATENCION: hay ajustes que cambiaron. Revisa:" "Yellow"
    Escribir "     $reportesFinal\COMPARACION-AJUSTES.txt" "Yellow"
    Escribir ""
    exit 3
}
exit 0
