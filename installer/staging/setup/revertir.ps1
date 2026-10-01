# =============================================================================
#  POS-iaDoS - REVERTIR A UN RESPALDO
#
#  Devuelve el sistema COMPLETO al estado de un respaldo: base de datos,
#  imagenes, configuracion y programa. No es "restaurar unas tablas": queda
#  exactamente como estaba el dia del respaldo.
#
#  Uso:
#    .\revertir.ps1 -Listar                      ver los respaldos disponibles
#    .\revertir.ps1                              usa el mas reciente (pregunta)
#    .\revertir.ps1 -Respaldo "C:\POS-iaDoS\backups\2026-09-30_1430-..."
#    .\revertir.ps1 -Respaldo "..." -SiSinPreguntar     desatendido
#
#  ANTES de revertir, este script toma un respaldo del estado ACTUAL
#  (etiqueta "antes-de-revertir"). Asi revertir tampoco es un camino de una
#  sola direccion: siempre se puede volver a donde se estaba.
# =============================================================================
param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [string]$Respaldo   = "",
    [switch]$Listar,
    [switch]$SiSinPreguntar,
    [switch]$SinRedDeSeguridad,
    [switch]$SoloBaseDeDatos,
    [switch]$SoloImagenes
)

$ErrorActionPreference = "Stop"

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
    param([int]$Puerto, [int]$Segundos = 120)
    $fin = (Get-Date).AddSeconds($Segundos)
    while ((Get-Date) -lt $fin) {
        try {
            $c = New-Object System.Net.Sockets.TcpClient
            $c.Connect("127.0.0.1", $Puerto); $c.Close(); return $true
        } catch { Start-Sleep -Milliseconds 1500 }
    }
    return $false
}

$script:NSSM = Join-Path $InstallDir "tools\nssm.exe"
$MYSQL       = Join-Path $InstallDir "mariadb\bin\mysql.exe"
$ENV_BACKEND = Join-Path $InstallDir "backend\.env"
$UPLOADS     = Join-Path $InstallDir "backend\uploads"
$BACKUPS     = Join-Path $InstallDir "backups"
$SVC_BACKEND = "PosIaDos-Backend"
$SVC_MARIADB = "PosIaDos-MariaDB"

# =============================================================================
#  Listado de respaldos
# =============================================================================
function Obtener-Respaldos {
    if (-not (Test-Path $BACKUPS)) { return @() }
    $lista = @()
    foreach ($d in (Get-ChildItem -Path $BACKUPS -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending)) {
        $sql = Join-Path $d.FullName "base-datos.sql"
        if (-not (Test-Path $sql)) { continue }   # sin volcado no sirve para revertir
        $man = $null
        $rutaMan = Join-Path $d.FullName "manifest.json"
        if (Test-Path $rutaMan) { try { $man = Get-Content $rutaMan -Raw -Encoding UTF8 | ConvertFrom-Json } catch {} }
        $lista += [pscustomobject]@{
            Carpeta  = $d.FullName
            Nombre   = $d.Name
            Fecha    = if ($man) { $man.fecha } else { $d.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss") }
            Version  = if ($man) { $man.version_respaldada } else { "?" }
            Etiqueta = if ($man) { $man.etiqueta } else { "?" }
            Bytes    = (Get-Item $sql).Length
            Tablas   = if ($man) { $man.base_sql.tablas } else { 0 }
            Imagenes = if ($man -and $man.uploads) { $man.uploads.archivos } else { (Get-ChildItem -Path (Join-Path $d.FullName "uploads") -Recurse -File -ErrorAction SilentlyContinue).Count }
            Sha      = if ($man -and $man.base_sql) { $man.base_sql.sha256 } else { "" }
        }
    }
    return $lista
}

if ($Listar) {
    $r = Obtener-Respaldos
    Escribir ""
    Escribir "  RESPALDOS DISPONIBLES EN $BACKUPS" "Cyan"
    Escribir "  ==========================================================" "Cyan"
    if ($r.Count -eq 0) {
        Escribir ""
        Escribir "  No hay ningun respaldo todavia." "Yellow"
        Escribir "  Genera uno con:  .\respaldar.ps1" "Yellow"
    } else {
        $i = 1
        foreach ($b in $r) {
            Escribir ""
            Escribir "  [$i] $($b.Nombre)" "White"
            Escribir "      Fecha    : $($b.Fecha)"
            Escribir "      Version  : $($b.Version)    Motivo: $($b.Etiqueta)"
            Escribir "      Base     : $(Tamano-Legible $b.Bytes)  ($($b.Tablas) tablas)"
            Escribir "      Imagenes : $($b.Imagenes) archivos"
            $i++
        }
        Escribir ""
        Escribir "  Para revertir a uno:" "Cyan"
        Escribir "    .\revertir.ps1 -Respaldo ""$($r[0].Carpeta)""" "Cyan"
    }
    Escribir ""
    exit 0
}

# =============================================================================
#  1. Elegir y validar el respaldo
# =============================================================================
Escribir ""
Escribir "  ==========================================================" "Yellow"
Escribir "   POS-iaDoS - REVERTIR A UN RESPALDO" "Yellow"
Escribir "  ==========================================================" "Yellow"

Titulo "[1/7] Validando el respaldo"

if (-not (Test-Path $MYSQL)) { Terminar 1 "No existe $MYSQL. No se puede restaurar la base." }
if (-not (Test-Path $ENV_BACKEND)) { Terminar 1 "No existe $ENV_BACKEND. No se sabe a que base restaurar." }

if ($Respaldo -eq "") {
    $disponibles = Obtener-Respaldos
    if ($disponibles.Count -eq 0) {
        Terminar 1 "No hay respaldos en $BACKUPS. Usa -Respaldo con la ruta, o genera uno con respaldar.ps1."
    }
    $Respaldo = $disponibles[0].Carpeta
    Aviso "No se indico respaldo: se usara el mas reciente"
    Escribir "        $($disponibles[0].Nombre)   ($($disponibles[0].Fecha), version $($disponibles[0].Version))"
}

if (-not (Test-Path $Respaldo)) { Terminar 1 "No existe la carpeta del respaldo: $Respaldo" }

$sqlPath = Join-Path $Respaldo "base-datos.sql"
if (-not (Test-Path $sqlPath)) {
    Terminar 1 "El respaldo no trae base-datos.sql. No sirve para revertir: $Respaldo"
}

$manifest = $null
$rutaMan = Join-Path $Respaldo "manifest.json"
if (Test-Path $rutaMan) { try { $manifest = Get-Content $rutaMan -Raw -Encoding UTF8 | ConvertFrom-Json } catch {} }

$sqlInfo = Get-Item $sqlPath
Ok "base-datos.sql  $(Tamano-Legible $sqlInfo.Length)"

# --- integridad: la huella del volcado debe coincidir con la del manifiesto ---
if ($manifest -and $manifest.base_sql -and $manifest.base_sql.sha256) {
    Escribir "        Verificando la huella del volcado..."
    $hashAhora = (Get-FileHash -Path $sqlPath -Algorithm SHA256).Hash
    if ($hashAhora -ne $manifest.base_sql.sha256) {
        Falla "La huella NO coincide con la del manifiesto."
        Escribir "        esperada: $($manifest.base_sql.sha256)" "Red"
        Escribir "        actual  : $hashAhora" "Red"
        Terminar 1 "El archivo de respaldo esta alterado o incompleto. No se restaura nada."
    }
    Ok "Huella verificada: el volcado esta intacto"
} else {
    Aviso "El respaldo no trae huella SHA256 (es de una version anterior del script)"
}

# --- la marca de fin del volcado ---
$cola = Get-Content -Path $sqlPath -Tail 12 -Encoding UTF8
if (-not (($cola -join "`n") -match "Dump completed")) {
    Terminar 1 "El volcado esta cortado (no trae la marca de fin). No se restaura nada."
}
Ok "El volcado esta completo"

$uploadsRespaldo = Join-Path $Respaldo "uploads"
$tieneUploads = (Test-Path $uploadsRespaldo) -and ((Get-ChildItem -Path $uploadsRespaldo -Recurse -File -ErrorAction SilentlyContinue).Count -gt 0)
$cuantasImg = 0
if ($tieneUploads) {
    $cuantasImg = (Get-ChildItem -Path $uploadsRespaldo -Recurse -File -ErrorAction SilentlyContinue).Count
    Ok "uploads del respaldo: $cuantasImg archivos"
} else {
    Aviso "El respaldo no trae imagenes; las imagenes actuales NO se tocaran"
}

$cfg = Leer-Env -Ruta $ENV_BACKEND
$dbHost = if ($cfg.DB_HOST) { $cfg.DB_HOST } else { "127.0.0.1" }
$dbPort = if ($cfg.DB_PORT) { $cfg.DB_PORT } else { "3306" }
$dbUser = if ($cfg.DB_USERNAME) { $cfg.DB_USERNAME } else { "pos_iados" }
$dbName = if ($cfg.DB_DATABASE) { $cfg.DB_DATABASE } else { "pos_iados" }
$dbPass = $cfg.DB_PASSWORD
$puerto = if ($cfg.APP_PORT) { [int]$cfg.APP_PORT } elseif ($cfg.PORT) { [int]$cfg.PORT } else { 3000 }   # el .env dice APP_PORT; PORT queda como alias por compatibilidad
if (-not $dbPass) { Terminar 1 "El .env no trae DB_PASSWORD. No se puede restaurar." }

# =============================================================================
#  2. Confirmacion
# =============================================================================
$versionActual = "desconocida"
$vj = Join-Path $InstallDir "version.json"
if (Test-Path $vj) { try { $versionActual = (Get-Content $vj -Raw -Encoding UTF8 | ConvertFrom-Json).version } catch {} }

Escribir ""
Escribir "  ----------------------------------------------------------" "Yellow"
Escribir "   QUE VA A PASAR" "Yellow"
Escribir "  ----------------------------------------------------------" "Yellow"
Escribir "   Version actual   : $versionActual"
Escribir "   Se regresa a     : $(if ($manifest) { $manifest.version_respaldada } else { '?' })  del $(if ($manifest) { $manifest.fecha } else { $sqlInfo.LastWriteTime })"
Escribir ""
if (-not $SoloImagenes) {
    Escribir "   La base de datos se reemplaza por la del respaldo." "White"
    Escribir "   TODO lo registrado despues de ese respaldo (ventas, pedidos," "White"
    Escribir "   productos nuevos) deja de estar en el sistema." "White"
}
if ($tieneUploads -and -not $SoloBaseDeDatos) {
    Escribir "   Las imagenes vuelven a las $cuantasImg del respaldo." "White"
}
Escribir ""
if (-not $SinRedDeSeguridad) {
    Escribir "   ANTES de eso se guarda un respaldo del estado de HOY," "Green"
    Escribir "   para poder deshacer este mismo revert si hiciera falta." "Green"
} else {
    Escribir "   ATENCION: se pidio -SinRedDeSeguridad. El estado de hoy NO" "Red"
    Escribir "   se va a guardar y este revert no se podra deshacer." "Red"
}
Escribir "  ----------------------------------------------------------" "Yellow"
Escribir ""

if (-not $SiSinPreguntar) {
    $resp = Read-Host "   Escribe REVERTIR para continuar (cualquier otra cosa cancela)"
    if ($resp -ne "REVERTIR") { Terminar 0 "Cancelado. No se toco nada." }
}

# =============================================================================
#  3. Red de seguridad: respaldo del estado actual
# =============================================================================
Titulo "[2/7] Guardando el estado de hoy (red de seguridad)"

$redCarpeta = ""
if ($SinRedDeSeguridad) {
    Aviso "Omitida por peticion expresa (-SinRedDeSeguridad)"
} else {
    $respaldarPs1 = Join-Path $InstallDir "tools\respaldar.ps1"
    if (-not (Test-Path $respaldarPs1)) {
        Falla "No se encontro $respaldarPs1"
        Terminar 1 "Sin la red de seguridad no se revierte. Reinstala las herramientas o usa -SinRedDeSeguridad si aceptas el riesgo."
    }
    # Sin Excel: aqui lo que importa es el volcado y las imagenes, rapido.
    & powershell -NoProfile -ExecutionPolicy Bypass -File $respaldarPs1 `
        -InstallDir $InstallDir -Etiqueta "antes-de-revertir" -SinExcel -SinImagenes 2>&1 |
        ForEach-Object { Escribir "      $_" }
    if ($LASTEXITCODE -ne 0) {
        Terminar 1 "No se pudo respaldar el estado de hoy. NO se revierte: primero hay que poder deshacer."
    }
    $ultimo = Get-ChildItem -Path $BACKUPS -Directory -Filter "*antes-de-revertir*" -ErrorAction SilentlyContinue |
              Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($ultimo) {
        $redCarpeta = $ultimo.FullName
        Ok "Estado de hoy guardado en: $($ultimo.Name)"
    }
}

$script:LogPath = Join-Path $Respaldo "revert-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# =============================================================================
#  4. Detener el sistema
# =============================================================================
Titulo "[3/7] Deteniendo el sistema"

$svc = Get-Service -Name $SVC_BACKEND -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -eq "Running") {
    Servicio -Accion "stop" -Nombre $SVC_BACKEND
    Start-Sleep -Seconds 3
    Ok "Backend detenido"
} else {
    Aviso "El backend ya estaba detenido"
}

# MariaDB tiene que seguir arriba para poder restaurar.
$svcDb = Get-Service -Name $SVC_MARIADB -ErrorAction SilentlyContinue
if ($svcDb -and $svcDb.Status -ne "Running") {
    Servicio -Accion "start" -Nombre $SVC_MARIADB
    Start-Sleep -Seconds 6
}
if (-not (Esperar-Puerto -Puerto ([int]$dbPort) -Segundos 60)) {
    Terminar 1 "MariaDB no responde en el puerto $dbPort. No se puede restaurar. El sistema quedo detenido: prendelo con 'nssm start $SVC_BACKEND'."
}
Ok "MariaDB respondiendo en el puerto $dbPort"

# =============================================================================
#  5. Restaurar la base de datos
# =============================================================================
$cnf = Join-Path $env:TEMP ("pos-restore-" + [guid]::NewGuid().ToString("N") + ".cnf")
$baseOk = $false

if ($SoloImagenes) {
    Titulo "[4/7] Base de datos"
    Aviso "Omitida por -SoloImagenes"
    $baseOk = $true
} else {
    Titulo "[4/7] Restaurando la base de datos"
    try {
        Set-Content -Path $cnf -Encoding ASCII -NoNewline `
            -Value "[client]`r`nuser=$dbUser`r`npassword=""$dbPass""`r`nhost=$dbHost`r`nport=$dbPort`r`n"

        # Se tira la base y el volcado la vuelve a crear. Es lo unico que deja
        # el sistema EXACTAMENTE como el dia del respaldo: si solo se
        # sobrescribieran las tablas del volcado, las tablas creadas despues se
        # quedarian ahi y el esquema no coincidiria con el programa que se
        # restaura. La red de seguridad del paso [2/7] cubre esto.
        $errPath = Join-Path $Respaldo "reportes\restore-errores.txt"
        New-Item -ItemType Directory -Path (Split-Path $errPath) -Force | Out-Null

        Escribir "        Vaciando la base $dbName..."
        $sqlDrop = Join-Path $env:TEMP ("pos-drop-" + [guid]::NewGuid().ToString("N") + ".sql")
        Set-Content -Path $sqlDrop -Encoding ASCII `
            -Value "DROP DATABASE IF EXISTS ``$dbName``;`r`nCREATE DATABASE ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`r`n"
        $pd = Start-Process -FilePath $MYSQL -ArgumentList @("--defaults-extra-file=$cnf") `
                -RedirectStandardInput $sqlDrop -RedirectStandardError $errPath `
                -NoNewWindow -Wait -PassThru
        Remove-Item -Path $sqlDrop -Force -ErrorAction SilentlyContinue
        if ($pd.ExitCode -ne 0) {
            if (Test-Path $errPath) { foreach ($l in (Get-Content $errPath | Select-Object -First 6)) { Escribir "        $l" "Red" } }
            Terminar 1 "No se pudo preparar la base. NADA se restauro y la base quedo como estaba."
        }

        Escribir "        Cargando el volcado ($(Tamano-Legible $sqlInfo.Length))... esto puede tardar varios minutos."
        $pr = Start-Process -FilePath $MYSQL `
                -ArgumentList @("--defaults-extra-file=$cnf", "--default-character-set=utf8mb4") `
                -RedirectStandardInput $sqlPath -RedirectStandardError $errPath `
                -NoNewWindow -Wait -PassThru

        if ($pr.ExitCode -ne 0) {
            Falla "mysql termino con codigo $($pr.ExitCode)"
            if (Test-Path $errPath) { foreach ($l in (Get-Content $errPath | Select-Object -First 10)) { Escribir "        $l" "Red" } }
            Escribir ""
            Escribir "   La base quedo a medias. Vuelve a correr este revert, o" "Yellow"
            if ($redCarpeta -ne "") { Escribir "   restaura la red de seguridad:  .\revertir.ps1 -Respaldo ""$redCarpeta""" "Yellow" }
            Terminar 1 "La restauracion de la base FALLO."
        }
        $baseOk = $true
    } finally {
        if (Test-Path $cnf) { Remove-Item -Path $cnf -Force -ErrorAction SilentlyContinue }
    }

    # --- comprobacion: se cuentan las tablas que quedaron ---
    $cnf2 = Join-Path $env:TEMP ("pos-check-" + [guid]::NewGuid().ToString("N") + ".cnf")
    try {
        Set-Content -Path $cnf2 -Encoding ASCII -NoNewline `
            -Value "[client]`r`nuser=$dbUser`r`npassword=""$dbPass""`r`nhost=$dbHost`r`nport=$dbPort`r`n"
        $salida = & $MYSQL "--defaults-extra-file=$cnf2" "-N" "-B" "-e" `
            "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$dbName' AND TABLE_TYPE='BASE TABLE'" 2>&1
        $tablas = 0
        if ($salida -match "(\d+)") { $tablas = [int]$Matches[1] }
        $esperadas = if ($manifest -and $manifest.base_sql) { [int]$manifest.base_sql.tablas } else { 0 }
        if ($esperadas -gt 0 -and $tablas -lt $esperadas) {
            Falla "Quedaron $tablas tablas y el respaldo traia $esperadas. REVISAR."
        } else {
            Ok "Base restaurada: $tablas tablas"
        }
    } catch {
        Aviso "No se pudo contar las tablas restauradas"
    } finally {
        if (Test-Path $cnf2) { Remove-Item -Path $cnf2 -Force -ErrorAction SilentlyContinue }
    }
}

# =============================================================================
#  6. Restaurar imagenes, configuracion y programa
# =============================================================================
Titulo "[5/7] Restaurando imagenes"

if ($SoloBaseDeDatos) {
    Aviso "Omitido por -SoloBaseDeDatos"
} elseif (-not $tieneUploads) {
    # Regla de oro: si el respaldo no trae imagenes, NO se espeja, porque /MIR
    # borraria todas las que hay ahora.
    Aviso "El respaldo no trae imagenes: las actuales se dejan intactas"
} else {
    $logRobo = Join-Path $Respaldo "reportes\uploads-restore.log"
    New-Item -ItemType Directory -Path (Split-Path $logRobo) -Force | Out-Null
    New-Item -ItemType Directory -Path $UPLOADS -Force | Out-Null
    # /MIR deja uploads identico al respaldo (borra lo que se subio despues).
    # Es lo correcto para un revert exacto, y la red de seguridad lo cubre.
    & robocopy $uploadsRespaldo $UPLOADS /MIR /R:2 /W:1 /NFL /NDL /NP /LOG:"$logRobo" | Out-Null
    if ($LASTEXITCODE -ge 8) {
        Falla "robocopy devolvio $LASTEXITCODE restaurando imagenes. Ver $logRobo"
    } else {
        $n = (Get-ChildItem -Path $UPLOADS -Recurse -File -ErrorAction SilentlyContinue).Count
        Ok "$n archivos de imagen restaurados"
    }
}

Titulo "[6/7] Restaurando configuracion y programa"

if ($SoloImagenes -or $SoloBaseDeDatos) {
    Aviso "Omitido por el modo parcial elegido"
} else {
    $cfgRespaldo = Join-Path $Respaldo "config\backend.env"
    if (Test-Path $cfgRespaldo) {
        # El .env actual se guarda al lado antes de pisarlo.
        Copy-Item -Path $ENV_BACKEND -Destination "$ENV_BACKEND.antes-del-revert" -Force -ErrorAction SilentlyContinue
        Copy-Item -Path $cfgRespaldo -Destination $ENV_BACKEND -Force
        Ok "backend\.env restaurado (el anterior quedo como .env.antes-del-revert)"
    } else {
        Aviso "El respaldo no trae config\backend.env; se deja el actual"
    }

    $verRespaldo = Join-Path $Respaldo "config\version.json"
    if (Test-Path $verRespaldo) {
        Copy-Item -Path $verRespaldo -Destination (Join-Path $InstallDir "version.json") -Force
        Ok "version.json restaurado"
    }

    $programa = Join-Path $Respaldo "programa"
    if (Test-Path $programa) {
        foreach ($nombre in @("dist", "public")) {
            $src = Join-Path $programa $nombre
            if (Test-Path $src) {
                & robocopy $src (Join-Path $InstallDir "backend\$nombre") /MIR /R:2 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
                if ($LASTEXITCODE -ge 8) { Falla "robocopy $LASTEXITCODE restaurando backend\$nombre" }
                else { Ok "backend\$nombre restaurado" }
            }
        }
        $dp = Join-Path $programa "dist-prod"
        if (Test-Path $dp) {
            & robocopy $dp (Join-Path $InstallDir "frontend\dist-prod") /MIR /R:2 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
            if ($LASTEXITCODE -ge 8) { Falla "robocopy $LASTEXITCODE restaurando las pantallas" }
            else { Ok "pantallas (dist-prod) restauradas" }
        }
    } else {
        Aviso "El respaldo no trae el programa compilado; se deja el actual"
        Escribir "        Si el revert era por un problema del programa, reinstala el exe de esa version." "Yellow"
    }
}

# =============================================================================
#  7. Arrancar y comprobar
# =============================================================================
Titulo "[7/7] Arrancando el sistema"

Servicio -Accion "start" -Nombre $SVC_BACKEND
Escribir "        Esperando a que responda el puerto $puerto..."

$arranco = Esperar-Puerto -Puerto $puerto -Segundos 150
$versionFinal = "?"
if ($arranco) {
    Ok "El sistema responde en el puerto $puerto"
    try {
        $r = Invoke-RestMethod -Uri "http://127.0.0.1:$puerto/api/deploy/version" -TimeoutSec 15
        if ($r.version) { $versionFinal = $r.version }
    } catch {
        try {
            $r = Invoke-RestMethod -Uri "http://127.0.0.1:$puerto/deploy/version" -TimeoutSec 15
            if ($r.version) { $versionFinal = $r.version }
        } catch { }
    }
    if ($versionFinal -ne "?") { Ok "Version que reporta el sistema: $versionFinal" }
} else {
    Falla "El sistema no respondio en $puerto despues de 150 segundos"
    Escribir ""
    Escribir "   Revisa:  $InstallDir\logs\backend-error.log" "Yellow"
    if ($redCarpeta -ne "") {
        Escribir "   Para volver al estado de hoy:" "Yellow"
        Escribir "     .\revertir.ps1 -Respaldo ""$redCarpeta""" "Yellow"
    }
}

Escribir ""
Escribir "  ==========================================================" $(if ($arranco) { "Green" } else { "Red" })
Escribir "   $(if ($arranco) { 'REVERT COMPLETADO' } else { 'REVERT APLICADO - EL SISTEMA NO ARRANCO' })" $(if ($arranco) { "Green" } else { "Red" })
Escribir "  ==========================================================" $(if ($arranco) { "Green" } else { "Red" })
Escribir ""
Escribir "   Respaldo usado : $Respaldo"
Escribir "   Version        : $(if ($manifest) { $manifest.version_respaldada } else { '?' })  (el sistema reporta $versionFinal)"
if ($redCarpeta -ne "") {
    Escribir "   Estado de hoy  : $redCarpeta" "Cyan"
    Escribir "                    (desde ahi se puede deshacer este revert)" "Cyan"
}
Escribir ""
Escribir "   Bitacora: $script:LogPath"
Escribir ""

exit $(if ($arranco) { 0 } else { 1 })
