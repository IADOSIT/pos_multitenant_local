# =============================================================================
#  POS-iaDoS - RESPALDO ANTES DE INSTALAR
#
#  Se corre en la PC del cliente ANTES de abrir el EXE nuevo. No instala, no
#  actualiza y no borra nada: solo copia. Es una segunda red, independiente del
#  respaldo que el EXE hace por su cuenta.
#
#  Deja en  C:\POS-iaDoS\backups\<fecha>-antes-de-instalar-v<version>\ :
#
#    base-datos.sql             volcado completo (mysqldump)
#    mariadb-data\              copia fisica de la base, con MariaDB detenida
#    uploads\                   todas las imagenes y archivos subidos
#    config\                    backend.env, version.json, my.ini, CREDENCIALES.txt
#    programa\                  el programa que tiene hoy, para poder volver a el
#    reportes\conteo-filas.txt  cuantas filas tiene cada tabla hoy
#    manifest.json              mismo formato que respaldar.ps1: REVERTIR.bat lo lista
#    RESUMEN.txt                lo que se lee primero
#
#  Uso, en PowerShell abierto como administrador:
#
#    powershell -ExecutionPolicy Bypass -File .\RESPALDO-ANTES-DE-INSTALAR.ps1
#    ... -CopiaExtra E:\      ademas lo copia a una USB y revisa la copia
#    ... -SinCopiaFisica      no detiene MariaDB (solo el volcado)
#
#  Despues de instalar, para confirmar que no falta ninguna fila:
#
#    ... -Comparar "C:\POS-iaDoS\backups\<la carpeta de este respaldo>"
#
#  Codigos de salida:
#    0  respaldo completo: se puede instalar
#    1  el respaldo NO quedo completo: NO instalar
#    2  respaldo completo, pero hay algo del equipo que revisar (ver RESUMEN.txt)
#
#  La contrasena de la base nunca se imprime ni viaja en la linea de comandos:
#  va en un archivo temporal de opciones que se borra al terminar.
# =============================================================================
param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [string]$CopiaExtra = "",
    [string]$Comparar   = "",
    [switch]$SinCopiaFisica
)

$ErrorActionPreference = "Stop"

$SVC_BACKEND = "PosIaDos-Backend"
$SVC_MARIADB = "PosIaDos-MariaDB"
$sinBOM      = New-Object System.Text.UTF8Encoding($false)

$script:LogPath         = $null
$script:Pendiente       = New-Object System.Collections.ArrayList
$script:PorRevisar      = New-Object System.Collections.ArrayList
$script:Incompleto      = $false
$script:Cnf             = $null
$script:BackendEstaba   = $false
$script:BackendDeVuelta = $false
$script:MariaDetenida   = $false
$script:NSSM            = ""
$dbPort    = 3306
$puertoApp = 3000

# -----------------------------------------------------------------------------
#  Salida: a pantalla y al log del respaldo. El equipo se opera en remoto, asi
#  que el log es la evidencia de lo que paso.
# -----------------------------------------------------------------------------
function Escribir {
    param([string]$Texto = "", [string]$Color = "Gray")
    Write-Host $Texto -ForegroundColor $Color
    if ($script:LogPath) {
        [System.IO.File]::AppendAllText($script:LogPath, $Texto + "`r`n", $sinBOM)
    } else {
        [void]$script:Pendiente.Add($Texto)
    }
}
function Titulo  { param([string]$t) Escribir ""; Escribir "  $t" "Cyan" }
function Ok      { param([string]$t) Escribir "    OK  $t" "Green" }
function Aviso   { param([string]$t) Escribir "    !   $t" "Yellow" }
function Falla   { param([string]$t) Escribir "    X   $t" "Red" }
# Algo que no invalida el respaldo pero que alguien tiene que mirar.
function Revisar { param([string]$t) [void]$script:PorRevisar.Add($t); Escribir "    !   $t" "Yellow" }

function Guardar-Texto {
    param([string]$Ruta, $Texto)
    if ($Texto -is [array]) { $Texto = ($Texto -join "`r`n") }
    if ($null -eq $Texto)   { $Texto = "" }
    [System.IO.File]::WriteAllText($Ruta, [string]$Texto, $sinBOM)
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
    if (-not (Test-Path $Ruta)) { return [double]0 }
    $m = Get-ChildItem -Path $Ruta -Recurse -File -Force -ErrorAction SilentlyContinue |
         Measure-Object -Property Length -Sum
    if ($null -eq $m.Sum) { return [double]0 }
    return [double]$m.Sum
}

function Contar-Archivos {
    param([string]$Ruta)
    if (-not (Test-Path $Ruta)) { return 0 }
    return @(Get-ChildItem -Path $Ruta -Recurse -File -Force -ErrorAction SilentlyContinue).Count
}

function Huella {
    param([string]$Ruta)
    try { return (Get-FileHash -Path $Ruta -Algorithm SHA256).Hash } catch { return "" }
}

function Espacio-Libre {
    param([string]$Ruta)
    try {
        $letra = (Split-Path -Qualifier $Ruta).TrimEnd(":")
        return [double](Get-PSDrive -Name $letra).Free
    } catch {
        return [double]0
    }
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

function Puerto-Abierto {
    param([int]$Puerto)
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $c.Connect("127.0.0.1", $Puerto)
        $c.Close()
        return $true
    } catch {
        return $false
    }
}

function Esperar-Puerto {
    param([int]$Puerto, [int]$Segundos = 90)
    $fin = (Get-Date).AddSeconds($Segundos)
    while ((Get-Date) -lt $fin) {
        if (Puerto-Abierto -Puerto $Puerto) { return $true }
        Start-Sleep -Milliseconds 1500
    }
    return $false
}

function Esperar-PuertoCerrado {
    param([int]$Puerto, [int]$Segundos = 30)
    $fin = (Get-Date).AddSeconds($Segundos)
    while ((Get-Date) -lt $fin) {
        if (-not (Puerto-Abierto -Puerto $Puerto)) { return $true }
        Start-Sleep -Milliseconds 1000
    }
    return $false
}

# nssm escribe en stderr cualquier aviso ("Unexpected status SERVICE_START_PENDING",
# "service not started"...). En Windows PowerShell 5.1, con 2>&1 y la preferencia
# en Stop, una sola linea de stderr detiene el script. Aqui se baja a Continue y el
# resultado real se mide despues por el estado del servicio y el puerto.
function Servicio {
    param([string]$Accion, [string]$Nombre)
    $ErrorActionPreference = "Continue"
    if ($script:NSSM -and (Test-Path $script:NSSM)) {
        & $script:NSSM $Accion $Nombre 2>&1 | Out-Null
    } elseif ($Accion -eq "stop") {
        Stop-Service -Name $Nombre -Force -ErrorAction SilentlyContinue
    } else {
        Start-Service -Name $Nombre -ErrorAction SilentlyContinue
    }
}

function Esperar-Estado {
    param([string]$Nombre, [string]$Estado, [int]$Segundos = 60)
    $fin = (Get-Date).AddSeconds($Segundos)
    while ((Get-Date) -lt $fin) {
        $s = Get-Service -Name $Nombre -ErrorAction SilentlyContinue
        if (-not $s) { return $false }
        if ($s.Status.ToString() -eq $Estado) { return $true }
        Start-Sleep -Milliseconds 1000
    }
    return $false
}

# Igual que install.ps1: nssm guarda en el registro la carpeta verdadera de la
# instalacion. Si el cliente la tiene en otra ruta, se respalda esa.
function Obtener-RutaInstalada {
    foreach ($svc in @($SVC_BACKEND, $SVC_MARIADB)) {
        $llave = "HKLM:\SYSTEM\CurrentControlSet\Services\$svc\Parameters"
        if (-not (Test-Path $llave)) { continue }
        $par = Get-ItemProperty -Path $llave -ErrorAction SilentlyContinue
        foreach ($valor in @($par.AppDirectory, $par.Application)) {
            if (-not $valor) { continue }
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

function Leer-Datadir {
    param([string]$Ini)
    if (-not (Test-Path $Ini)) { return "" }
    foreach ($l in (Get-Content -Path $Ini -Encoding UTF8)) {
        if ($l -match '^\s*datadir\s*=\s*(.+?)\s*$') {
            return $Matches[1].Trim('"').Trim("'").Replace('/', '\')
        }
    }
    return ""
}

# -----------------------------------------------------------------------------
#  Base de datos. La contrasena va en un archivo de opciones, nunca en la linea
#  de comandos (se veria en el administrador de tareas).
# -----------------------------------------------------------------------------
function Crear-Cnf {
    $script:Cnf = Join-Path $env:TEMP ("pos-resp-" + [guid]::NewGuid().ToString("N") + ".cnf")
    $t = "[client]`r`nuser=$dbUser`r`npassword=""$dbPass""`r`nhost=$dbHost`r`nport=$dbPort`r`n"
    [System.IO.File]::WriteAllText($script:Cnf, $t, $sinBOM)
}

function Borrar-Cnf {
    if ($script:Cnf -and (Test-Path $script:Cnf)) {
        Remove-Item -Path $script:Cnf -Force -ErrorAction SilentlyContinue
    }
}

# Start-Process junta los argumentos con espacios y no pone comillas: si la
# carpeta temporal del usuario tiene un espacio, la ruta se partiria en dos.
function Arg-Cnf { return "--defaults-extra-file=""$($script:Cnf)""" }

function Consultar {
    param([string]$Sql, [string]$Salida)
    $entrada = Join-Path $env:TEMP ("pos-q-" + [guid]::NewGuid().ToString("N") + ".sql")
    $err     = Join-Path $env:TEMP ("pos-e-" + [guid]::NewGuid().ToString("N") + ".txt")
    Guardar-Texto -Ruta $entrada -Texto $Sql
    try {
        $p = Start-Process -FilePath $MYSQL `
                -ArgumentList @((Arg-Cnf), "-N", "-B", "--default-character-set=utf8mb4", $dbName) `
                -RedirectStandardInput $entrada -RedirectStandardOutput $Salida -RedirectStandardError $err `
                -NoNewWindow -Wait -PassThru
        if ($p.ExitCode -ne 0 -and (Test-Path $err)) {
            foreach ($l in (Get-Content $err | Select-Object -First 5)) { Escribir "        $l" "Red" }
        }
        return $p.ExitCode
    } finally {
        Remove-Item -Path $entrada -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $err -Force -ErrorAction SilentlyContinue
    }
}

# Devuelve tabla -> filas exactas (COUNT(*), no el estimado de information_schema).
function Contar-Filas {
    $tmp = Join-Path $env:TEMP ("pos-l-" + [guid]::NewGuid().ToString("N") + ".txt")
    try {
        $c = Consultar -Salida $tmp -Sql ("SELECT TABLE_NAME FROM information_schema.TABLES " +
            "WHERE TABLE_SCHEMA='$dbName' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;")
        if ($c -ne 0) { return $null }
        $tablas = @(Get-Content -Path $tmp -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })
        $conteo = [ordered]@{}
        if ($tablas.Count -eq 0) { return $conteo }

        $partes = foreach ($t in $tablas) { 'SELECT ''' + $t + ''', COUNT(*) FROM `' + $t + '`' }
        $c = Consultar -Salida $tmp -Sql (($partes -join "`r`nUNION ALL`r`n") + ";")
        if ($c -ne 0) { return $null }
        foreach ($l in (Get-Content -Path $tmp -Encoding UTF8)) {
            $p = $l.Split("`t")
            if ($p.Count -ge 2) { $conteo[$p[0].Trim()] = [long]$p[1].Trim() }
        }
        if ($conteo.Count -ne $tablas.Count) { return $null }
        return $conteo
    } finally {
        Remove-Item -Path $tmp -Force -ErrorAction SilentlyContinue
    }
}

# -----------------------------------------------------------------------------
#  Salida del script: siempre deja los servicios como estaban y borra el
#  archivo con la contrasena, pase lo que pase.
# -----------------------------------------------------------------------------
function Restaurar-Servicios {
    if ($script:MariaDetenida) {
        Servicio -Accion "start" -Nombre $SVC_MARIADB
        if (Esperar-Puerto -Puerto $dbPort -Segundos 120) { $script:MariaDetenida = $false }
    }
    if ($script:BackendEstaba -and -not $script:BackendDeVuelta) {
        Servicio -Accion "start" -Nombre $SVC_BACKEND
        $script:BackendDeVuelta = Esperar-Puerto -Puerto $puertoApp -Segundos 120
    }
}

function Terminar {
    param([int]$Codigo, [string]$Mensaje)
    Borrar-Cnf
    Restaurar-Servicios
    Escribir ""
    if ($Codigo -eq 0) { Escribir "  $Mensaje" "Green" } else { Escribir "  $Mensaje" "Red" }
    Escribir ""
    exit $Codigo
}

# =============================================================================
#  Modo -Comparar: despues de instalar, cuenta otra vez y compara. No detiene
#  nada ni escribe en la base.
# =============================================================================
function Comparar-ContraRespaldo {
    Titulo "Comparando la base de hoy contra el respaldo"
    $tsv = Join-Path $Comparar "reportes\conteo-filas.tsv"
    if (-not (Test-Path $tsv)) {
        Terminar 1 "No existe $tsv. Indica la carpeta de un respaldo hecho con este script."
    }
    if (-not (Esperar-Puerto -Puerto $dbPort -Segundos 10)) {
        Terminar 1 "MariaDB no responde en el puerto $dbPort. Prende el servicio $SVC_MARIADB y vuelve a correrlo."
    }

    $antes = [ordered]@{}
    foreach ($l in (Get-Content -Path $tsv -Encoding UTF8)) {
        $p = $l.Split("`t")
        if ($p.Count -ge 2 -and $p[0].Trim() -ne "") { $antes[$p[0].Trim()] = [long]$p[1].Trim() }
    }

    Crear-Cnf
    $ahora = Contar-Filas
    if ($null -eq $ahora) { Terminar 1 "No se pudo contar las filas de la base actual." }

    $faltan  = New-Object System.Collections.ArrayList
    $menos   = New-Object System.Collections.ArrayList
    $iguales = 0; $conMas = 0
    foreach ($t in $antes.Keys) {
        if (-not $ahora.Contains($t)) { [void]$faltan.Add($t); continue }
        $a = [long]$antes[$t]; $b = [long]$ahora[$t]
        if ($b -lt $a)     { [void]$menos.Add(("{0,-42} antes {1,10}   ahora {2,10}" -f $t, $a, $b)) }
        elseif ($b -gt $a) { $conMas++ }
        else               { $iguales++ }
    }
    $nuevas = @($ahora.Keys | Where-Object { -not $antes.Contains($_) })

    $rep = New-Object System.Collections.ArrayList
    [void]$rep.Add("COMPARACION CONTRA EL RESPALDO  $(Get-Date -Format 'dd/MM/yyyy HH:mm')")
    [void]$rep.Add("Respaldo: $Comparar")
    [void]$rep.Add("")
    [void]$rep.Add("Tablas en el respaldo          : $($antes.Count)")
    [void]$rep.Add("Tablas hoy                     : $($ahora.Count)")
    [void]$rep.Add("Iguales                        : $iguales")
    [void]$rep.Add("Con mas filas (ventas nuevas)  : $conMas")
    [void]$rep.Add("Tablas nuevas de la version    : $($nuevas.Count)")
    [void]$rep.Add("Tablas que DESAPARECIERON      : $($faltan.Count)")
    [void]$rep.Add("Tablas con MENOS filas         : $($menos.Count)")
    foreach ($t in $faltan) { [void]$rep.Add("  FALTA    $t") }
    foreach ($t in $menos)  { [void]$rep.Add("  MENOS    $t") }
    foreach ($r in $rep) { Escribir "    $r" }

    $sello = Get-Date -Format "yyyyMMdd-HHmmss"
    try { Guardar-Texto -Ruta (Join-Path $Comparar "reportes\comparacion-$sello.txt") -Texto $rep } catch {}

    if ($faltan.Count -gt 0 -or $menos.Count -gt 0) {
        Terminar 1 "FALTA INFORMACION. No sigas operando: revierte con REVERTIR.bat eligiendo este respaldo."
    }
    Terminar 0 "No falta nada: todas las tablas del respaldo siguen ahi con las mismas filas o mas."
}

# =============================================================================
#  1. Revisiones previas: nada se toca hasta que todo esto pase
# =============================================================================
$inicio = Get-Date

Escribir ""
Escribir "  ==========================================================" "Cyan"
if ($Comparar) {
    Escribir "   POS-iaDoS - COMPARAR CONTRA EL RESPALDO" "Cyan"
} else {
    Escribir "   POS-iaDoS - RESPALDO ANTES DE INSTALAR" "Cyan"
}
Escribir "  ==========================================================" "Cyan"

try {

Titulo "[1/7] Revisando el equipo"

$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $esAdmin) {
    Terminar 1 "Abre PowerShell como administrador (clic derecho > Ejecutar como administrador) y vuelve a correrlo. No se toco nada."
}
Ok "Corriendo como administrador"

$rutaReal = Obtener-RutaInstalada
if ($rutaReal -and ($rutaReal.TrimEnd("\") -ne $InstallDir.TrimEnd("\"))) {
    Aviso "Los servicios apuntan a $rutaReal (no a $InstallDir): se respalda esa carpeta"
    $InstallDir = $rutaReal
}
if (-not (Test-Path $InstallDir)) { Terminar 1 "No existe $InstallDir. Indica la ruta con -InstallDir. No se toco nada." }

$MARIADB_BIN = Join-Path $InstallDir "mariadb\bin"
$MYSQLDUMP   = Join-Path $MARIADB_BIN "mysqldump.exe"
if (-not (Test-Path $MYSQLDUMP)) { $MYSQLDUMP = Join-Path $MARIADB_BIN "mariadb-dump.exe" }
$MYSQL       = Join-Path $MARIADB_BIN "mysql.exe"
if (-not (Test-Path $MYSQL)) { $MYSQL = Join-Path $MARIADB_BIN "mariadb.exe" }
$script:NSSM = Join-Path $InstallDir "tools\nssm.exe"
$ENV_BACKEND = Join-Path $InstallDir "backend\.env"
$UPLOADS     = Join-Path $InstallDir "backend\uploads"
$BUILTIN     = Join-Path $InstallDir "backend\uploads-builtin"
$VERSION_JS  = Join-Path $InstallDir "version.json"
$MY_INI      = Join-Path $InstallDir "mariadb\my.ini"

if (-not (Test-Path $ENV_BACKEND)) { Terminar 1 "No existe $ENV_BACKEND. No se sabe que base respaldar. No se toco nada." }
if (-not (Test-Path $MYSQLDUMP))   { Terminar 1 "No existe mysqldump en $MARIADB_BIN. No se toco nada." }
if (-not (Test-Path $MYSQL))       { Terminar 1 "No existe mysql en $MARIADB_BIN. No se toco nada." }
Ok "Instalacion encontrada en $InstallDir"

$version = "desconocida"
if (Test-Path $VERSION_JS) {
    try { $version = (Get-Content $VERSION_JS -Raw -Encoding UTF8 | ConvertFrom-Json).version } catch { $version = "ilegible" }
}
Ok "Version instalada hoy: $version"

$cfg    = Leer-Env -Ruta $ENV_BACKEND
$dbHost = if ($cfg.DB_HOST) { $cfg.DB_HOST } else { "127.0.0.1" }
$dbPort = if ($cfg.DB_PORT) { [int]$cfg.DB_PORT } else { 3306 }
$dbUser = if ($cfg.DB_USERNAME) { $cfg.DB_USERNAME } else { "pos_iados" }
$dbName = if ($cfg.DB_DATABASE) { $cfg.DB_DATABASE } else { "pos_iados" }
$dbPass = $cfg.DB_PASSWORD
$puertoApp = if ($cfg.APP_PORT) { [int]$cfg.APP_PORT } elseif ($cfg.PORT) { [int]$cfg.PORT } else { 3000 }
if (-not $dbPass) { Terminar 1 "El .env no trae DB_PASSWORD. No se puede leer la base. No se toco nada." }
Ok "Base de datos: $dbName en ${dbHost}:${dbPort} (usuario $dbUser)"

if ($Comparar) { Comparar-ContraRespaldo }

$DATADIR = Leer-Datadir -Ini $MY_INI
if (-not $DATADIR -or -not (Test-Path $DATADIR)) { $DATADIR = Join-Path $InstallDir "mariadb\data" }

# --- espacio: se calcula ANTES de empezar ---
$tamDatos    = Tamano-Carpeta -Ruta $DATADIR
$tamUploads  = (Tamano-Carpeta -Ruta $UPLOADS) + (Tamano-Carpeta -Ruta $BUILTIN)
$tamPrograma = (Tamano-Carpeta -Ruta (Join-Path $InstallDir "backend\dist")) +
               (Tamano-Carpeta -Ruta (Join-Path $InstallDir "backend\public")) +
               (Tamano-Carpeta -Ruta (Join-Path $InstallDir "frontend\dist-prod"))
# El .sql pesa menos que los datos de InnoDB; aun asi se cuenta dos veces
# (volcado + copia fisica) y se deja un margen.
$necesario   = ($tamDatos * 2) + $tamUploads + $tamPrograma + 209715200
Escribir "        Base: $(Tamano-Legible $tamDatos)   Imagenes: $(Tamano-Legible $tamUploads)   Programa: $(Tamano-Legible $tamPrograma)"

$libre = Espacio-Libre -Ruta $InstallDir
if ($libre -gt 0) {
    Escribir "        Libre en $(Split-Path -Qualifier $InstallDir) $(Tamano-Legible $libre)   hacen falta unos $(Tamano-Legible $necesario)"
    if ($libre -lt $necesario) { Terminar 1 "No hay espacio suficiente en el disco. Libera espacio y vuelve a correrlo. No se toco nada." }
    Ok "Espacio suficiente"
} else {
    Aviso "No se pudo medir el espacio libre; se continua"
}

if ($CopiaExtra) {
    if (-not (Test-Path $CopiaExtra)) { Terminar 1 "No existe $CopiaExtra (la USB o carpeta de -CopiaExtra). No se toco nada." }
    $libreExtra = Espacio-Libre -Ruta $CopiaExtra
    if ($libreExtra -gt 0 -and $libreExtra -lt $necesario) {
        Terminar 1 "No cabe el respaldo en $CopiaExtra ($(Tamano-Legible $libreExtra) libres). No se toco nada."
    }
    Ok "Copia extra a $CopiaExtra"
}

# =============================================================================
#  2. Carpeta del respaldo: dentro de backups\ para que REVERTIR.bat la liste.
#     Nunca escribe encima de otro respaldo.
# =============================================================================
Titulo "[2/7] Creando la carpeta del respaldo"

$sello   = Get-Date -Format "yyyy-MM-dd_HHmm"
$carpeta = Join-Path $InstallDir "backups\$sello-antes-de-instalar-v$version"
$base = $carpeta; $n = 2
while (Test-Path $carpeta) { $carpeta = "$base-$n"; $n++ }

foreach ($sub in @("", "config", "reportes", "programa")) {
    New-Item -ItemType Directory -Path (Join-Path $carpeta $sub) -Force | Out-Null
}
$script:LogPath = Join-Path $carpeta "respaldo.log"
Guardar-Texto -Ruta $script:LogPath -Texto (($script:Pendiente -join "`r`n") + "`r`n")
Ok "Carpeta: $carpeta"

Crear-Cnf

# =============================================================================
#  3. Pausar el sistema: se detiene el backend para que no entren ventas a
#     medias mientras se copia. MariaDB tiene que estar arriba para el volcado.
# =============================================================================
Titulo "[3/7] Pausando el sistema"

$svcB = Get-Service -Name $SVC_BACKEND -ErrorAction SilentlyContinue
if ($svcB -and $svcB.Status -eq "Running") {
    $script:BackendEstaba = $true
    Servicio -Accion "stop" -Nombre $SVC_BACKEND
    if (Esperar-Estado -Nombre $SVC_BACKEND -Estado "Stopped" -Segundos 60) {
        Ok "Backend detenido (se vuelve a prender al final)"
    } else {
        Aviso "El backend tarda en detenerse; el volcado es consistente igual (--single-transaction)"
    }
} elseif ($svcB) {
    Aviso "El backend ya estaba detenido; se deja detenido al final"
} else {
    Aviso "No existe el servicio $SVC_BACKEND; se respalda igual"
}

if (-not (Puerto-Abierto -Puerto $dbPort)) {
    Aviso "MariaDB no responde; se intenta prender"
    Servicio -Accion "start" -Nombre $SVC_MARIADB
    if (-not (Esperar-Puerto -Puerto $dbPort -Segundos 90)) {
        Terminar 1 "MariaDB no responde en el puerto $dbPort. Sin la base no hay respaldo. Los servicios se dejaron como estaban."
    }
}
Ok "MariaDB respondiendo en el puerto $dbPort"

# =============================================================================
#  4. Conteo de filas y volcado de la base
# =============================================================================
Titulo "[4/7] Respaldando la base de datos"

$conteo = Contar-Filas
if ($null -eq $conteo) { Terminar 1 "No se pudo leer la base para contar las filas. No se continua." }
$filasTotal = [long]0
foreach ($v in $conteo.Values) { $filasTotal += [long]$v }

$tsv = @(); $txt = @()
$txt += "FILAS POR TABLA  $(Get-Date -Format 'dd/MM/yyyy HH:mm')   base $dbName   version $version"
$txt += ""
foreach ($t in $conteo.Keys) {
    $tsv += "$t`t$($conteo[$t])"
    $txt += ("{0,-45} {1,12:N0}" -f $t, [long]$conteo[$t])
}
$txt += ""
$txt += ("{0,-45} {1,12:N0}" -f "TOTAL ($($conteo.Count) tablas)", $filasTotal)
Guardar-Texto -Ruta (Join-Path $carpeta "reportes\conteo-filas.tsv") -Texto $tsv
Guardar-Texto -Ruta (Join-Path $carpeta "reportes\conteo-filas.txt") -Texto $txt
Ok ("{0} tablas, {1:N0} filas contadas una por una (reportes\conteo-filas.txt)" -f $conteo.Count, $filasTotal)

$sqlPath = Join-Path $carpeta "base-datos.sql"
$errPath = Join-Path $carpeta "reportes\mysqldump-errores.txt"
$comun   = @("--single-transaction", "--hex-blob", "--default-character-set=utf8mb4",
             "--add-drop-table", "--complete-insert", "--triggers")

$p = Start-Process -FilePath $MYSQLDUMP `
        -ArgumentList (@((Arg-Cnf)) + $comun + @("--routines", "--events", "--databases", $dbName)) `
        -RedirectStandardOutput $sqlPath -RedirectStandardError $errPath `
        -NoNewWindow -Wait -PassThru
if ($p.ExitCode -ne 0) {
    Aviso "mysqldump termino con codigo $($p.ExitCode):"
    if (Test-Path $errPath) { foreach ($l in (Get-Content $errPath | Select-Object -First 5)) { Escribir "        $l" "Yellow" } }
    # Lo mas comun es que el usuario no tenga permiso de leer eventos o rutinas.
    # El POS no usa ninguna de las dos, asi que se repite sin ellas.
    Aviso "Se repite sin rutinas ni eventos (el POS no usa ninguno)"
    $p = Start-Process -FilePath $MYSQLDUMP `
            -ArgumentList (@((Arg-Cnf)) + $comun + @("--databases", $dbName)) `
            -RedirectStandardOutput $sqlPath -RedirectStandardError $errPath `
            -NoNewWindow -Wait -PassThru
    if ($p.ExitCode -ne 0) {
        if (Test-Path $errPath) { foreach ($l in (Get-Content $errPath | Select-Object -First 8)) { Escribir "        $l" "Red" } }
        Terminar 1 "El respaldo de la base FALLO. NO instales. Los servicios se dejaron como estaban."
    }
}

# --- no basta con que el archivo exista: tiene que estar completo ---
$sqlInfo      = Get-Item $sqlPath
$cola         = Get-Content -Path $sqlPath -Tail 12 -Encoding UTF8
$completo     = ($cola -join "`n") -match "Dump completed"
$tablasEnDump = @(Select-String -Path $sqlPath -Pattern "^CREATE TABLE").Count

if (-not $completo) { Terminar 1 "El volcado quedo cortado (no trae la marca de fin). NO instales." }
if ($tablasEnDump -lt $conteo.Count) {
    Terminar 1 "El volcado trae $tablasEnDump tablas y la base tiene $($conteo.Count). NO instales."
}
$sqlHash = Huella -Ruta $sqlPath
Ok "base-datos.sql  $(Tamano-Legible $sqlInfo.Length)  -  $tablasEnDump tablas  -  volcado completo"
if ($sqlHash) { Escribir "        SHA256 $sqlHash" }

# =============================================================================
#  5. Copia fisica de la base: la segunda red. Se detiene MariaDB un momento
#     para que ningun archivo se copie a medio escribir.
# =============================================================================
Titulo "[5/7] Copia fisica de la base"

$destData = Join-Path $carpeta "mariadb-data"
$fisicaOk = $false; $fisicaArchivos = 0; $fisicaBytes = [double]0

if ($SinCopiaFisica) {
    Aviso "Omitida (-SinCopiaFisica). El volcado de arriba SI esta completo."
} elseif (-not (Get-Service -Name $SVC_MARIADB -ErrorAction SilentlyContinue)) {
    Aviso "No existe el servicio ${SVC_MARIADB}: no se puede detener la base con seguridad. Se omite; el volcado SI esta completo."
} elseif (-not (Test-Path $DATADIR)) {
    Aviso "No se encontro la carpeta de datos ($DATADIR). Se omite; el volcado SI esta completo."
} else {
    Escribir "        Deteniendo MariaDB..."
    $script:MariaDetenida = $true
    Servicio -Accion "stop" -Nombre $SVC_MARIADB
    $parada  = Esperar-Estado -Nombre $SVC_MARIADB -Estado "Stopped" -Segundos 90
    $cerrado = Esperar-PuertoCerrado -Puerto $dbPort -Segundos 30

    if (-not $parada -or -not $cerrado) {
        Revisar "MariaDB no termino de detenerse; no se hizo la copia fisica para no copiar archivos a medio escribir. El volcado SI esta completo."
    } else {
        $logRobo = Join-Path $carpeta "reportes\mariadb-data-copia.log"
        & robocopy $DATADIR $destData /E /COPY:DAT /R:2 /W:1 /NFL /NDL /NP /LOG:"$logRobo" | Out-Null
        $rc = $LASTEXITCODE
        $origenArchivos = Contar-Archivos -Ruta $DATADIR
        $origenBytes    = Tamano-Carpeta -Ruta $DATADIR
        $fisicaArchivos = Contar-Archivos -Ruta $destData
        $fisicaBytes    = Tamano-Carpeta -Ruta $destData
        if ($rc -lt 8 -and $fisicaArchivos -eq $origenArchivos -and $fisicaBytes -eq $origenBytes) {
            $fisicaOk = $true
            Ok "mariadb-data\  $fisicaArchivos archivos, $(Tamano-Legible $fisicaBytes)  (identica al original)"
        } else {
            Revisar "La copia fisica no quedo igual (robocopy $rc, $fisicaArchivos de $origenArchivos archivos). El volcado SI esta completo."
        }
    }

    Escribir "        Prendiendo MariaDB..."
    Servicio -Accion "start" -Nombre $SVC_MARIADB
    if (Esperar-Puerto -Puerto $dbPort -Segundos 120) {
        $script:MariaDetenida = $false
        Ok "MariaDB prendida de nuevo"
    } else {
        Servicio -Accion "start" -Nombre $SVC_MARIADB
        if (Esperar-Puerto -Puerto $dbPort -Segundos 60) {
            $script:MariaDetenida = $false
            Ok "MariaDB prendida de nuevo (al segundo intento)"
        } else {
            Revisar "MariaDB no volvio a prender. Revisa $InstallDir\logs. Los datos no se tocaron: solo se copiaron."
        }
    }
}

# =============================================================================
#  6. Imagenes, configuracion y programa
# =============================================================================
Titulo "[6/7] Respaldando imagenes, configuracion y programa"

$uploadsDestino  = Join-Path $carpeta "uploads"
$archivosUploads = 0
if (Test-Path $UPLOADS) {
    $logRobo = Join-Path $carpeta "reportes\uploads-copia.log"
    & robocopy $UPLOADS $uploadsDestino /E /COPY:DAT /R:2 /W:1 /NFL /NDL /NP /LOG:"$logRobo" | Out-Null
    $rc = $LASTEXITCODE
    $origenCuenta    = Contar-Archivos -Ruta $UPLOADS
    $archivosUploads = Contar-Archivos -Ruta $uploadsDestino
    if ($rc -ge 8 -or $archivosUploads -lt $origenCuenta) {
        $script:Incompleto = $true
        Falla "Se copiaron $archivosUploads de $origenCuenta imagenes (robocopy $rc). Ver reportes\uploads-copia.log"
    } else {
        Ok "uploads\  $archivosUploads archivos  ($(Tamano-Legible (Tamano-Carpeta -Ruta $uploadsDestino)))"
    }
} else {
    Aviso "No existe $UPLOADS (no hay imagenes subidas)"
}
if (Test-Path $BUILTIN) {
    & robocopy $BUILTIN (Join-Path $carpeta "uploads-builtin") /E /R:1 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
    Ok "uploads-builtin\ (imagenes de fabrica)"
}

$cfgDir = Join-Path $carpeta "config"
foreach ($par in @(
    @{ src = $ENV_BACKEND; dst = "backend.env" },
    @{ src = $VERSION_JS;  dst = "version.json" },
    @{ src = $MY_INI;      dst = "my.ini" },
    @{ src = (Join-Path $InstallDir "CREDENCIALES.txt"); dst = "CREDENCIALES.txt" }
)) {
    if (Test-Path $par.src) {
        Copy-Item -Path $par.src -Destination (Join-Path $cfgDir $par.dst) -Force
        Ok "config\$($par.dst)"
    }
}
if (-not (Test-Path (Join-Path $cfgDir "backend.env"))) {
    $script:Incompleto = $true
    Falla "No se pudo copiar backend\.env"
}

$programa = Join-Path $carpeta "programa"
foreach ($nombre in @("dist", "public")) {
    $src = Join-Path $InstallDir "backend\$nombre"
    if (Test-Path $src) {
        & robocopy $src (Join-Path $programa $nombre) /E /R:1 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
        Ok "programa\$nombre  ($(Tamano-Legible (Tamano-Carpeta -Ruta (Join-Path $programa $nombre))))"
    }
}
$distProd = Join-Path $InstallDir "frontend\dist-prod"
if (Test-Path $distProd) {
    & robocopy $distProd (Join-Path $programa "dist-prod") /E /R:1 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
    Ok "programa\dist-prod (pantallas)"
}

try {
    $esquema = Select-String -Path $sqlPath -Pattern '^(CREATE TABLE|\s+`|\) ENGINE)' | ForEach-Object { $_.Line }
    Guardar-Texto -Ruta (Join-Path $carpeta "reportes\esquema.txt") -Texto $esquema
    Ok "reportes\esquema.txt (estructura de las tablas)"
} catch {
    Aviso "No se pudo extraer el esquema del volcado"
}

# =============================================================================
#  7. Manifiesto, resumen, arranque y copia extra
# =============================================================================
Titulo "[7/7] Cerrando el respaldo"

Borrar-Cnf

$manifest = [ordered]@{
    producto           = "POS-iaDoS"
    tipo               = "respaldo-antes-de-instalar"
    etiqueta           = "antes-de-instalar"
    fecha              = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    version_respaldada = $version
    install_dir        = $InstallDir
    base_datos         = $dbName
    carpeta            = $carpeta
    base_sql           = [ordered]@{
        archivo  = "base-datos.sql"
        bytes    = $sqlInfo.Length
        tablas   = $tablasEnDump
        sha256   = $sqlHash
        completo = $true
    }
    conteo_filas       = [ordered]@{
        tablas = $conteo.Count
        filas  = $filasTotal
        archivo = "reportes\conteo-filas.tsv"
    }
    copia_fisica       = [ordered]@{
        hecha    = $fisicaOk
        carpeta  = "mariadb-data"
        archivos = $fisicaArchivos
        bytes    = $fisicaBytes
        datadir_original = $DATADIR
    }
    uploads            = [ordered]@{
        archivos = $archivosUploads
        bytes    = (Tamano-Carpeta -Ruta $uploadsDestino)
    }
    excel              = [ordered]@{ generado = $false; filas = 0; completo = $false }
    ajustes_leidos     = $false
    imagenes           = [ordered]@{ inventario = $false }
    revertir_con       = "tools\revertir.ps1 -Respaldo ""$carpeta"""
}
Guardar-Texto -Ruta (Join-Path $carpeta "manifest.json") -Texto ($manifest | ConvertTo-Json -Depth 6)
Ok "manifest.json"

# --- se vuelve a prender el sistema antes de escribir el resumen ---
if ($script:BackendEstaba) {
    Escribir "        Volviendo a prender el sistema..."
    Restaurar-Servicios
    if ($script:BackendDeVuelta) {
        Ok "Sistema operando de nuevo en el puerto $puertoApp"
    } else {
        Revisar "El sistema no respondio en el puerto $puertoApp despues de 2 minutos. Revisa $InstallDir\logs\backend-error.log. El respaldo SI esta completo."
    }
}

$duracion = [int]((Get-Date) - $inicio).TotalSeconds
$R = New-Object System.Collections.ArrayList
function L { param([string]$t = "") [void]$R.Add($t) }

L "==============================================================="
L "  RESPALDO ANTES DE INSTALAR - POS-iaDoS"
L "  $(Get-Date -Format 'dd/MM/yyyy HH:mm')   version respaldada: $version"
L "==============================================================="
L ""
L "  Carpeta:"
L "    $carpeta"
L ""
L "  QUE SE GUARDO"
L "    Base de datos     base-datos.sql   $(Tamano-Legible $sqlInfo.Length)  ($tablasEnDump tablas)"
L ("    Filas contadas    {0:N0} en {1} tablas  (reportes\conteo-filas.txt)" -f $filasTotal, $conteo.Count)
if ($fisicaOk) {
    L "    Copia fisica      mariadb-data\    $fisicaArchivos archivos, $(Tamano-Legible $fisicaBytes)"
} else {
    L "    Copia fisica      NO se hizo (el volcado si esta completo)"
}
L "    Imagenes          uploads\         $archivosUploads archivos"
L "    Configuracion     config\backend.env, version.json, my.ini"
L "    Programa          programa\dist, programa\public"
L ""
L "  OJO: config\backend.env trae la contrasena de la base. Si copias"
L "  esta carpeta a una USB, guardala como guardas las llaves."
L ""
L "  DESPUES DE INSTALAR, para confirmar que no falta ninguna fila:"
L "    powershell -ExecutionPolicy Bypass -File RESPALDO-ANTES-DE-INSTALAR.ps1 -Comparar ""$carpeta"""
L ""
L "  COMO REVERTIR  (devuelve el sistema a como estaba hoy)"
L "    1. Doble clic en $InstallDir\REVERTIR.bat y elegir este respaldo"
L "       (aparece en la lista porque vive en la carpeta backups)."
L "    2. O desde PowerShell como administrador:"
L "         cd ""$InstallDir\tools"""
L "         .\revertir.ps1 -Respaldo ""$carpeta"""
if ($fisicaOk) {
    L "    3. Ultimo recurso, si lo anterior falla (misma MariaDB de hoy):"
    L "         detener $SVC_BACKEND y $SVC_MARIADB"
    L "         renombrar $DATADIR  a  data-fallida"
    L "         copiar mariadb-data\ de este respaldo a $DATADIR"
    L "         prender $SVC_MARIADB y despues $SVC_BACKEND"
}
L ""
if ($script:PorRevisar.Count -gt 0) {
    L "  POR REVISAR"
    foreach ($x in $script:PorRevisar) { L "    - $x" }
    L ""
}
L "  Tardo $duracion segundos."
L "==============================================================="
Guardar-Texto -Ruta (Join-Path $carpeta "RESUMEN.txt") -Texto $R
Ok "RESUMEN.txt"

if ($CopiaExtra) {
    $destExtra = Join-Path $CopiaExtra ("POS-iaDoS-respaldos\" + (Split-Path -Leaf $carpeta))
    Escribir "        Copiando a $destExtra ..."
    & robocopy $carpeta $destExtra /E /R:2 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
    $rc = $LASTEXITCODE
    $hashExtra = Huella -Ruta (Join-Path $destExtra "base-datos.sql")
    if ($rc -lt 8 -and $hashExtra -eq $sqlHash -and (Contar-Archivos -Ruta $destExtra) -ge (Contar-Archivos -Ruta $carpeta)) {
        Ok "Copia extra verificada (misma huella SHA256 de la base): $destExtra"
    } else {
        Revisar "La copia a $CopiaExtra no quedo igual (robocopy $rc). El respaldo en $carpeta SI esta completo."
    }
}

} catch {
    Falla "Error inesperado: $($_.Exception.Message)"
    if ($_.InvocationInfo) { Escribir "        linea $($_.InvocationInfo.ScriptLineNumber)" "Red" }
    Terminar 1 "El respaldo NO quedo completo. NO instales. Los servicios se dejaron como estaban."
}

# =============================================================================
#  Veredicto
# =============================================================================
Borrar-Cnf
Escribir ""
if ($script:Incompleto) {
    Escribir "  ==========================================================" "Red"
    Escribir "   EL RESPALDO NO QUEDO COMPLETO: NO INSTALES" "Red"
    Escribir "  ==========================================================" "Red"
    Escribir "   Lee $carpeta\respaldo.log" "Yellow"
    Escribir ""
    exit 1
}
if ($script:PorRevisar.Count -gt 0) {
    Escribir "  ==========================================================" "Yellow"
    Escribir "   RESPALDO COMPLETO, PERO HAY ALGO QUE REVISAR" "Yellow"
    Escribir "  ==========================================================" "Yellow"
    foreach ($x in $script:PorRevisar) { Escribir "   - $x" "Yellow" }
} else {
    Escribir "  ==========================================================" "Green"
    Escribir "   RESPALDO COMPLETO: YA PUEDES INSTALAR" "Green"
    Escribir "  ==========================================================" "Green"
}
Escribir ""
Escribir "   $carpeta" "White"
Escribir ("   Base: {0} ({1} tablas, {2:N0} filas)   Imagenes: {3} archivos" -f (Tamano-Legible $sqlInfo.Length), $tablasEnDump, $filasTotal, $archivosUploads) "Gray"
Escribir ""
Escribir "   Lee primero:  $carpeta\RESUMEN.txt" "Cyan"
Escribir ""
if ($script:PorRevisar.Count -gt 0) { exit 2 }
exit 0
