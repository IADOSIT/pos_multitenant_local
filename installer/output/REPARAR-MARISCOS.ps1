# =============================================================================
#  POS-iaDoS - REPARAR DESPUES DE ACTUALIZAR (instalacion local / offline)
#
#  Hecho para Mariscos 2-13's despues de pasar de la v2.2.50 a la v2.4.7, pero
#  sirve en cualquier instalacion local con una sola base pos_iados.
#
#  Pasos, en este orden:
#    -Paso Revisar    SOLO LEE. Reporte de usuarios, tiendas, ventas, cajas,
#                     licencia, bitacora, respaldos y navegador, y prueba en
#                     vivo lo que ve cada usuario (sin escribir nada).
#    -Paso Comparar   Carga el respaldo de ANTES de actualizar en una base
#                     APARTE (pos_ensayo_recuperado_*) y cuenta, tabla por
#                     tabla, que filas del respaldo ya no estan hoy. La base
#                     real no se toca.
#    -Paso Importar   Regresa a la base real SOLO las filas que faltan (nunca
#                     cambia ni borra las que ya estan). Sin -Confirmar solo
#                     dice lo que haria. Con -Confirmar primero toma un
#                     respaldo completo; si ese respaldo falla, no hace nada.
#    -Paso Unificar   Pasa a la tienda real las ventas, cajas y pedidos que
#                     quedaron en una tienda que no existe o sin tienda (la del
#                     superadmin). Lo de otra tienda real nunca se mueve. Con
#                     varias tiendas pide -Tienda <numero>. Sin -Confirmar solo
#                     dice lo que haria. Deja un .sql para deshacerlo.
#
#  Uso (PowerShell como administrador):
#    powershell -NoProfile -ExecutionPolicy Bypass -File C:\REPARAR-MARISCOS.ps1
#    powershell -NoProfile -ExecutionPolicy Bypass -File C:\REPARAR-MARISCOS.ps1 -Paso Comparar
#    powershell -NoProfile -ExecutionPolicy Bypass -File C:\REPARAR-MARISCOS.ps1 -Paso Importar
#    powershell -NoProfile -ExecutionPolicy Bypass -File C:\REPARAR-MARISCOS.ps1 -Paso Importar -Confirmar
#    powershell -NoProfile -ExecutionPolicy Bypass -File C:\REPARAR-MARISCOS.ps1 -Paso Unificar
#    powershell -NoProfile -ExecutionPolicy Bypass -File C:\REPARAR-MARISCOS.ps1 -Paso Unificar -Confirmar
#
#  El reporte queda en el Escritorio (REPARAR-MARISCOS-<paso>-<fecha>.txt) y
#  en C:\POS-iaDoS\logs.
#
#  Codigos de salida: 0 bien / nada pendiente, 2 hay algo que atender,
#  1 no se pudo correr (no se toco nada).
#
#  Nunca: borra filas, cambia contrasenas, toca imagenes ni imprime claves.
# =============================================================================
param(
    [ValidateSet("Revisar", "Comparar", "Importar", "Unificar")]
    [string]$Paso       = "Revisar",
    [string]$InstallDir = "C:\POS-iaDoS",
    [string]$Respaldo   = "",
    [string]$Base       = "",
    [string]$BaseActual = "",
    [string]$Tablas     = "",
    [string]$Usuarios   = "",
    [int]$Tienda        = 0,
    [switch]$Confirmar,
    [switch]$SinPruebas
)

$ErrorActionPreference = "Stop"

# Tablas que son historia del negocio con tienda: las que Unificar puede mover.
$TABLAS_UNIFICAR = @("ventas", "cajas", "pedidos", "devoluciones", "cotizaciones",
                     "encuestas_servicio", "entregas_pedido", "movimientos_inventario",
                     "pesaje_logs", "menu_digital_orders")

# Tablas que son ESTADO (no historia): una fila que falta ahi casi siempre se
# quito a proposito (mesa liberada, apartado cerrado, ajuste reemplazado).
# Importar no las regresa sola; se pueden pedir con -Tablas.
$NO_IMPORTAR_SOLAS = @("mesa_asignaciones", "mesas_juntas", "apartados_inventario",
                       "menu_digital_snapshot", "producto_tienda", "licencias",
                       "tenant_perfiles", "migrations", "typeorm_metadata")
$PATRON_CONFIG = '^config_|_config$|_configs$'

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
#  Salida: pantalla + reporte. El cliente se opera en remoto; el reporte es la
#  evidencia.
# -----------------------------------------------------------------------------
$script:Lineas      = New-Object System.Collections.ArrayList
$script:Problemas   = New-Object System.Collections.ArrayList
$script:Temporales  = New-Object System.Collections.ArrayList
$script:Cnf         = $null
$script:ComoRoot    = $false
$script:UltimoError = ""
$script:BT          = [string][char]96
$sello              = Get-Date -Format "yyyy-MM-dd_HHmm"

function Escribir {
    param([string]$Texto = "", [string]$Color = "Gray")
    [void]$script:Lineas.Add($Texto)
    Write-Host $Texto -ForegroundColor $Color
}
function Titulo   { param([string]$t) Escribir ""; Escribir "  $t" "Cyan" }
function Ok       { param([string]$t) Escribir "    OK  $t" "Green" }
function Aviso    { param([string]$t) Escribir "    !   $t" "Yellow" }
function Falla    { param([string]$t) Escribir "    X   $t" "Red" }
function Problema { param([string]$t) [void]$script:Problemas.Add($t); Escribir "    !!  $t" "Yellow" }

function Ident { param([string]$n) return $script:BT + $n + $script:BT }

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

function Archivo-Temporal {
    param([string]$Extension = ".tmp")
    $f = Join-Path $env:TEMP ("pos-reparar-" + [guid]::NewGuid().ToString("N") + $Extension)
    [void]$script:Temporales.Add($f)
    return $f
}

function Limpiar {
    foreach ($f in $script:Temporales) {
        if ($f -and (Test-Path $f)) { Remove-Item -Path $f -Force -ErrorAction SilentlyContinue }
    }
    $script:Temporales.Clear()
}

function Guardar-Reporte {
    $nombre = "REPARAR-MARISCOS-$Paso-$sello.txt"
    $texto  = ($script:Lineas | ForEach-Object { [string]$_ }) -join "`r`n"
    $rutas  = @()
    $escritorio = [Environment]::GetFolderPath("Desktop")
    if ($escritorio -and (Test-Path $escritorio)) { $rutas += (Join-Path $escritorio $nombre) }
    $logs = Join-Path $InstallDir "logs"
    if (Test-Path $logs) { $rutas += (Join-Path $logs ("reparar-" + $Paso.ToLower() + "-$sello.txt")) }
    foreach ($r in $rutas) {
        try { Set-TextoSinBOM -Ruta $r -Texto $texto; Write-Host "  Reporte: $r" -ForegroundColor Cyan } catch { }
    }
}

function Terminar {
    param([int]$Codigo, [string]$Mensaje)
    Limpiar
    Escribir ""
    if ($script:Problemas.Count -gt 0) {
        Escribir "  ----------------------------------------------------------" "Yellow"
        Escribir "  LO QUE HAY QUE ATENDER ($($script:Problemas.Count)):" "Yellow"
        foreach ($p in $script:Problemas) { Escribir "   - $p" "Yellow" }
    }
    Escribir ""
    $color = if ($Codigo -eq 0) { "Green" } elseif ($Codigo -eq 2) { "Yellow" } else { "Red" }
    Escribir "  $Mensaje" $color
    Escribir ""
    Guardar-Reporte
    exit $Codigo
}

trap {
    Falla "Error inesperado: $($_.Exception.Message)"
    if ($_.InvocationInfo) { Escribir "        en la linea $($_.InvocationInfo.ScriptLineNumber)" "Red" }
    Terminar 1 "El script se detuvo por un error. Si iba a escribir, la transaccion no se confirmo: la base quedo como estaba."
}

# -----------------------------------------------------------------------------
#  MariaDB. Cada consulta va en un archivo y se manda por stdin: asi PowerShell
#  5.1 no destroza comillas ni acentos al pasarlos como argumento, y la clave
#  solo vive en un .cnf temporal que se borra al terminar.
# -----------------------------------------------------------------------------
function Consultar {
    param([string]$Sql, [string]$BaseDatos = "", [switch]$Tolerar)
    $fIn  = Archivo-Temporal ".sql"
    $fOut = Archivo-Temporal ".out"
    $fErr = Archivo-Temporal ".err"
    Set-TextoSinBOM -Ruta $fIn -Texto $Sql
    $argumentos = @("--defaults-extra-file=""$($script:Cnf)""", "-N", "-B", "--default-character-set=utf8mb4")
    if ($BaseDatos) { $argumentos += "--database=$BaseDatos" }
    $p = Start-Process -FilePath $MYSQL -ArgumentList $argumentos `
            -RedirectStandardInput $fIn -RedirectStandardOutput $fOut -RedirectStandardError $fErr `
            -NoNewWindow -Wait -PassThru
    $salida = @()
    if (Test-Path $fOut) { $salida = @(Get-Content -Path $fOut -Encoding UTF8) }
    $err = ""
    if (Test-Path $fErr) { $err = [string](Get-Content -Path $fErr -Encoding UTF8 -Raw) }
    foreach ($f in @($fIn, $fOut, $fErr)) { Remove-Item -Path $f -Force -ErrorAction SilentlyContinue }
    if ($p.ExitCode -ne 0 -or $err -match 'ERROR \d+') {
        $script:UltimoError = (($err -replace '\s+', ' ').Trim())
        if ($Tolerar) { return $null }
        throw "MariaDB respondio: $($script:UltimoError)"
    }
    return ,$salida
}

function A-Filas {
    param($Salida)
    $r = New-Object System.Collections.ArrayList
    foreach ($l in @($Salida)) {
        if ($null -eq $l -or $l -eq "") { continue }
        [void]$r.Add([string[]]($l -split "`t"))
    }
    return ,$r
}

function Uno {
    param([string]$Sql, [string]$BaseDatos = "")
    $s = Consultar -Sql $Sql -BaseDatos $BaseDatos
    if ($s.Count -eq 0) { return "" }
    return ([string]$s[0]).Trim()
}

function Imprimir-Tabla {
    param([string[]]$Encabezado, $Filas, [string]$Sangria = "      ")
    $n = $Encabezado.Count
    $anchos = New-Object int[] $n
    for ($i = 0; $i -lt $n; $i++) { $anchos[$i] = $Encabezado[$i].Length }
    $recortar = {
        param($v)
        $v = [string]$v
        if ($v.Length -gt 42) { $v = $v.Substring(0, 41) + "~" }
        return $v
    }
    foreach ($f in $Filas) {
        for ($i = 0; $i -lt $n; $i++) {
            $v = if ($i -lt $f.Count) { & $recortar $f[$i] } else { "" }
            if ($v.Length -gt $anchos[$i]) { $anchos[$i] = $v.Length }
        }
    }
    $armar = {
        param($vals)
        $partes = @()
        for ($i = 0; $i -lt $n; $i++) {
            $v = if ($i -lt $vals.Count) { & $recortar $vals[$i] } else { "" }
            $partes += $v.PadRight($anchos[$i])
        }
        return ($Sangria + ($partes -join "  ")).TrimEnd()
    }
    Escribir (& $armar $Encabezado) "White"
    Escribir ($Sangria + (($anchos | ForEach-Object { "-" * $_ }) -join "  "))
    foreach ($f in $Filas) { Escribir (& $armar $f) }
    if (@($Filas).Count -eq 0) { Escribir "$Sangria(sin filas)" }
}

function Leer-ClaveRoot {
    foreach ($rel in @("tools\install.ps1", "setup\install.ps1")) {
        $p = Join-Path $InstallDir $rel
        if (-not (Test-Path $p)) { continue }
        foreach ($l in (Get-Content -Path $p -Encoding UTF8 -TotalCount 200)) {
            if ($l -match '^\s*\$DB_ROOT_PASS\s*=\s*"([^"]*)"') { return $Matches[1] }
        }
    }
    return $null
}

function Nuevo-Cnf {
    param([string]$Usuario, [string]$Clave)
    $f = Archivo-Temporal ".cnf"
    Set-TextoSinBOM -Ruta $f -Texto "[client]`r`nuser=$Usuario`r`npassword=""$Clave""`r`nhost=$dbHost`r`nport=$dbPort`r`n"
    return $f
}

# Root hace falta para crear la base aparte donde se carga el respaldo. Si no
# se encuentra, se usa el usuario de la app (solo puede crear pos_ensayo_*).
function Preparar-Conexion {
    param([switch]$PreferirRoot)
    if ($PreferirRoot) {
        $claveRoot = Leer-ClaveRoot
        if ($claveRoot) {
            $script:Cnf = Nuevo-Cnf -Usuario "root" -Clave $claveRoot
            $prueba = Consultar -Sql "SELECT 1;" -Tolerar
            if ($null -ne $prueba) { $script:ComoRoot = $true; Ok "Conectado a MariaDB como administrador (la clave no se muestra)"; return }
            Aviso "La clave de administrador de MariaDB no sirvio; se usa el usuario de la app"
        } else {
            Aviso "No se encontro la clave de administrador de MariaDB; se usa el usuario de la app"
        }
    }
    $script:Cnf = Nuevo-Cnf -Usuario $dbUser -Clave $dbPass
    $prueba = Consultar -Sql "SELECT 1;" -Tolerar
    if ($null -eq $prueba) { Terminar 1 "No se pudo conectar a MariaDB ($($script:UltimoError)). Revisa que el servicio PosIaDos-MariaDB este iniciado." }
    $script:ComoRoot = $false
    Ok "Conectado a MariaDB con el usuario de la app"
}

function Existe-Base {
    param([string]$Nombre)
    $n = Uno "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='$Nombre';"
    return ($n -eq "1")
}

function Columnas {
    param([string]$BaseDatos, [string]$Tabla)
    $s = Consultar "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$BaseDatos' AND TABLE_NAME='$Tabla' ORDER BY ORDINAL_POSITION;"
    return ,@($s | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ -ne "" })
}

function Valor-Sql {
    param([string]$v)
    if ($v -match '^-?\d+$') { return $v }
    return "'" + ($v -replace '\\', '\\' -replace "'", "''") + "'"
}

# =============================================================================
#  Arranque comun
# =============================================================================
Escribir ""
Escribir "  ==========================================================" "Cyan"
Escribir "   POS-iaDoS - REPARAR DESPUES DE ACTUALIZAR   (paso: $Paso)" "Cyan"
Escribir "  ==========================================================" "Cyan"
Escribir "   Equipo: $env:COMPUTERNAME    Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
if ($Paso -in @("Importar", "Unificar")) {
    if ($Confirmar) { Escribir "   Modo: SE APLICAN LOS CAMBIOS (con respaldo antes)" "Yellow" }
    else            { Escribir "   Modo: SIMULACION. No se cambia nada; para aplicar agrega -Confirmar" "Green" }
}

$MYSQL       = Join-Path $InstallDir "mariadb\bin\mysql.exe"
$NODE        = Join-Path $InstallDir "node\node.exe"
$ENV_BACKEND = Join-Path $InstallDir "backend\.env"
$RESPALDAR   = Join-Path $InstallDir "tools\respaldar.ps1"
$REVERTIR    = Join-Path $InstallDir "tools\revertir.ps1"
$BACKUPS     = Join-Path $InstallDir "backups"
$ESTADO_BASE = Join-Path $InstallDir "logs\reparar-base-recuperada.txt"

if (-not (Test-Path $InstallDir))  { Terminar 1 "No existe $InstallDir. Indica la ruta con -InstallDir." }
if (-not (Test-Path $ENV_BACKEND)) { Terminar 1 "No existe $ENV_BACKEND." }
if (-not (Test-Path $MYSQL))       { Terminar 1 "No existe $MYSQL." }

$cfg     = Leer-Env -Ruta $ENV_BACKEND
$dbHost  = if ($cfg.DB_HOST)     { $cfg.DB_HOST }     else { "127.0.0.1" }
$dbPort  = if ($cfg.DB_PORT)     { $cfg.DB_PORT }     else { "3306" }
$dbUser  = if ($cfg.DB_USERNAME) { $cfg.DB_USERNAME } else { "pos_iados" }
$dbName  = if ($cfg.DB_DATABASE) { $cfg.DB_DATABASE } else { "pos_iados" }
$dbPass  = $cfg.DB_PASSWORD
$appPort = if ($cfg.APP_PORT)    { $cfg.APP_PORT }    else { "3000" }
if (-not $dbPass) { Terminar 1 "El .env no trae DB_PASSWORD." }
# Lo que se paso a mano, antes de llenar los valores por defecto.
$script:RespaldoDado = $Respaldo; $script:BaseDada = $Base; $script:ActualDada = $BaseActual
if ($BaseActual -eq "") { $BaseActual = $dbName }
if ($BaseActual -notmatch '^[A-Za-z0-9_]+$') { Terminar 1 "Nombre de base no valido: $BaseActual" }
if ($BaseActual -ne $dbName) { Aviso "MODO PRUEBA: se trabaja sobre la base '$BaseActual', no sobre la del sistema ($dbName)" }

# =============================================================================
#  Respaldos: cual sirve para comparar
# =============================================================================
function Listar-Respaldos {
    if (-not (Test-Path $BACKUPS)) { return ,@() }
    $r = @()
    foreach ($d in (Get-ChildItem -Path $BACKUPS -Directory | Sort-Object Name -Descending)) {
        $sql = Join-Path $d.FullName "base-datos.sql"
        $tam = if (Test-Path $sql) { (Get-Item $sql).Length } else { 0 }
        $r += [pscustomobject]@{ Nombre = $d.Name; Ruta = $d.FullName; Sql = $tam }
    }
    return ,$r
}

function Elegir-Respaldo {
    if ($Respaldo -ne "") {
        if (-not (Test-Path (Join-Path $Respaldo "base-datos.sql"))) { Terminar 1 "El respaldo '$Respaldo' no trae base-datos.sql." }
        return $Respaldo
    }
    $lr = Listar-Respaldos; $todos = @($lr | Where-Object { $_.Sql -gt 1024 })
    # El de antes de actualizar: lo toma el EXE (preactualizacion) o a mano
    # (manual). Los que hace este script o revertir son de DESPUES y no sirven.
    $elegido = $todos | Where-Object { $_.Nombre -match 'preactualizacion' } | Select-Object -First 1
    if (-not $elegido) { $elegido = $todos | Where-Object { $_.Nombre -match 'manual' } | Select-Object -First 1 }
    if (-not $elegido) { $elegido = $todos | Where-Object { $_.Nombre -notmatch 'prereparacion|preunificar|antes-de-revertir|ensayo' } | Select-Object -First 1 }
    if (-not $elegido) { Terminar 1 "No hay ningun respaldo con base-datos.sql en $BACKUPS. Indica uno con -Respaldo." }
    return $elegido.Ruta
}

# =============================================================================
#  Cargar un respaldo en una base aparte (mismo candado que el ensayo)
# =============================================================================
function Cargar-Respaldo {
    param([string]$Carpeta)
    $sqlPath = Join-Path $Carpeta "base-datos.sql"
    $nombre  = "pos_ensayo_recuperado_" + (Get-Date -Format "MMdd_HHmm")
    if ($nombre -eq $dbName -or $nombre -eq $BaseActual) { Terminar 1 "La base aparte no puede llamarse igual que la real." }
    Ok "Respaldo: $Carpeta ($(Tamano-Legible (Get-Item $sqlPath).Length))"

    # Un volcado hecho con --databases trae 'USE `pos_iados`': si se cargara
    # asi, escribiria en la base REAL. Esas lineas se quitan y se verifica que
    # no quede ninguna antes de cargar.
    $limpio = Archivo-Temporal ".sql"
    $quitadas = 0; $renombradas = 0
    $patronCalificado = '^(\s*(?:INSERT\s+INTO|REPLACE\s+INTO|CREATE\s+TABLE|DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE|LOCK\s+TABLES))\s+`[A-Za-z0-9_$]+`\s*\.'
    $lector = $null; $escritor = $null
    try {
        $lector   = New-Object System.IO.StreamReader($sqlPath, [System.Text.Encoding]::UTF8)
        $escritor = New-Object System.IO.StreamWriter($limpio, $false, (New-Object System.Text.UTF8Encoding($false)))
        while ($null -ne ($linea = $lector.ReadLine())) {
            if ($linea -match '^\s*(USE\s|CREATE\s+DATABASE|DROP\s+DATABASE|ALTER\s+DATABASE)') {
                $quitadas++
                $escritor.WriteLine("-- quitado por reparar: " + $linea.Substring(0, [Math]::Min(60, $linea.Length)))
                continue
            }
            if ($linea -match $patronCalificado) { $linea = $linea -replace $patronCalificado, '$1 '; $renombradas++ }
            $escritor.WriteLine($linea)
        }
    } finally {
        if ($escritor) { $escritor.Flush(); $escritor.Close() }
        if ($lector)   { $lector.Close() }
    }
    $sobrevivientes = Select-String -Path $limpio -Pattern '^\s*(USE\s|CREATE\s+DATABASE|DROP\s+DATABASE)' -List
    if ($sobrevivientes) { Terminar 1 "La copia todavia trae instrucciones que cambian de base. Se aborta; la base real no se toco." }
    Ok "Copia preparada: $quitadas instrucciones de cambio de base quitadas, $renombradas nombres corregidos"

    # La base aparte anterior de este mismo script se reemplaza: es una copia
    # de un respaldo que sigue completo en disco.
    if (Test-Path $ESTADO_BASE) {
        $previa = (Get-Content $ESTADO_BASE -Encoding UTF8 | Where-Object { $_ -match '^base=' } | Select-Object -First 1) -replace '^base=', ''
        if ($previa -match '^pos_ensayo_recuperado_[0-9_]+$' -and $previa -ne $dbName -and $previa -ne $BaseActual -and (Existe-Base $previa)) {
            [void](Consultar "DROP DATABASE IF EXISTS $(Ident $previa);")
            Escribir "        Copia anterior $previa reemplazada"
        }
    }

    $tablasRealAntes = Uno "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$BaseActual';"
    $crear = Consultar -Sql "CREATE DATABASE $(Ident $nombre) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -Tolerar
    if ($null -eq $crear) {
        Falla "No se pudo crear la base aparte: $($script:UltimoError)"
        Terminar 1 "Sin permiso para crear la base aparte. La base real no se toco."
    }
    Escribir "        Cargando el respaldo en $nombre ... (puede tardar unos minutos)"
    $fErr = Archivo-Temporal ".err"
    $pl = Start-Process -FilePath $MYSQL `
            -ArgumentList @("--defaults-extra-file=""$($script:Cnf)""", "--default-character-set=utf8mb4", "--database=$nombre") `
            -RedirectStandardInput $limpio -RedirectStandardError $fErr -NoNewWindow -Wait -PassThru
    $errTxt = if (Test-Path $fErr) { [string](Get-Content $fErr -Raw -Encoding UTF8) } else { "" }
    if ($pl.ExitCode -ne 0 -or $errTxt -match 'ERROR \d+') {
        Falla "La carga fallo: $((($errTxt -replace '\s+', ' ').Trim()))"
        [void](Consultar -Sql "DROP DATABASE IF EXISTS $(Ident $nombre);" -Tolerar)
        Terminar 1 "No se pudo cargar el respaldo. La base real no se toco."
    }
    $tablasCopia     = Uno "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$nombre';"
    $tablasRealDesp  = Uno "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$BaseActual';"
    Ok "Respaldo cargado en $nombre ($tablasCopia tablas)"
    if ($tablasRealAntes -ne $tablasRealDesp) { Problema "La base real cambio de $tablasRealAntes a $tablasRealDesp tablas durante la carga. Avisar a soporte." }
    else { Ok "Verificado: la base real sigue igual ($tablasRealDesp tablas)" }
    Set-TextoSinBOM -Ruta $ESTADO_BASE -Texto "base=$nombre`r`nrespaldo=$Carpeta`r`nfecha=$(Get-Date -Format 'yyyy-MM-dd HH:mm')`r`n"
    return $nombre
}

function Base-Recuperada {
    # 1) la que se pidio, 2) la que dejo el ultimo Comparar, 3) se carga
    if ($Base -ne "") {
        if (-not (Existe-Base $Base)) { Terminar 1 "No existe la base '$Base'." }
        if ($Base -eq $dbName -or $Base -eq $BaseActual) { Terminar 1 "-Base no puede ser la base real." }
        Ok "Se usa la base aparte indicada: $Base"
        return $Base
    }
    if (Test-Path $ESTADO_BASE) {
        $previa = (Get-Content $ESTADO_BASE -Encoding UTF8 | Where-Object { $_ -match '^base=' } | Select-Object -First 1) -replace '^base=', ''
        $resp   = (Get-Content $ESTADO_BASE -Encoding UTF8 | Where-Object { $_ -match '^respaldo=' } | Select-Object -First 1) -replace '^respaldo=', ''
        if ($previa -and ($Respaldo -eq "" -or $Respaldo -eq $resp) -and (Existe-Base $previa)) {
            Ok "Se usa la copia que dejo Comparar: $previa (de $resp)"
            return $previa
        }
    }
    return (Cargar-Respaldo (Elegir-Respaldo))
}

# =============================================================================
#  Comparar respaldo contra hoy, tabla por tabla, por llave primaria
# =============================================================================
function Comparar-Bases {
    param([string]$Rec, [string]$Cur)
    $meta = A-Filas (Consultar ("SELECT c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_KEY, c.EXTRA " +
        "FROM information_schema.COLUMNS c JOIN information_schema.TABLES t " +
        "ON t.TABLE_SCHEMA=c.TABLE_SCHEMA AND t.TABLE_NAME=c.TABLE_NAME AND t.TABLE_TYPE='BASE TABLE' " +
        "WHERE c.TABLE_SCHEMA IN ('$Rec','$Cur') ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION;"))
    $cols = @{ $Rec = @{}; $Cur = @{} }
    foreach ($f in $meta) {
        $s = $f[0]; $t = $f[1]
        if (-not $cols[$s].ContainsKey($t)) { $cols[$s][$t] = New-Object System.Collections.ArrayList }
        $extra = if ($f.Count -gt 4) { $f[4] } else { "" }
        [void]$cols[$s][$t].Add([pscustomobject]@{ Nombre = $f[2]; Pk = ($f[3] -eq "PRI"); Generada = ($extra -match 'GENERATED') })
    }
    $resultado = New-Object System.Collections.ArrayList
    $sql = New-Object System.Text.StringBuilder
    $rT = { param($t) "$(Ident $Rec).$(Ident $t)" }
    $cT = { param($t) "$(Ident $Cur).$(Ident $t)" }
    foreach ($t in ($cols[$Rec].Keys | Sort-Object)) {
        if (-not $cols[$Cur].ContainsKey($t)) {
            [void]$resultado.Add([pscustomobject]@{ Tabla = $t; Respaldo = -1; Hoy = -1; Faltan = -1; Colisiones = -1; Pk = @(); Comunes = @(); Clave = ""; Nota = "YA NO EXISTE HOY" })
            continue
        }
        $pkR = @($cols[$Rec][$t] | Where-Object { $_.Pk } | ForEach-Object { $_.Nombre })
        $pkC = @($cols[$Cur][$t] | Where-Object { $_.Pk } | ForEach-Object { $_.Nombre })
        $nomCur  = @($cols[$Cur][$t] | Where-Object { -not $_.Generada } | ForEach-Object { $_.Nombre })
        $comunes = @($cols[$Rec][$t] | Where-Object { $nomCur -contains $_.Nombre } | ForEach-Object { $_.Nombre })
        $pkOk = ($pkR.Count -gt 0 -and ($pkR -join ",") -eq ($pkC -join ","))
        $clave = ""
        foreach ($cand in @("created_at", "venta_id", "caja_id", "pedido_id", "producto_id", "usuario_id", "tienda_id", "tenant_id")) {
            if ($comunes -contains $cand -and $pkR -notcontains $cand) { $clave = $cand; break }
        }
        $obj = [pscustomobject]@{ Tabla = $t; Respaldo = 0; Hoy = 0; Faltan = -1; Colisiones = -1; Pk = $pkR; Comunes = $comunes; Clave = $clave; Nota = "" }
        [void]$resultado.Add($obj)
        $cuentaR = "(SELECT COUNT(*) FROM $(& $rT $t))"
        $cuentaC = "(SELECT COUNT(*) FROM $(& $cT $t))"
        if ($pkOk) {
            $on = ($pkR | ForEach-Object { "r.$(Ident $_) <=> c.$(Ident $_)" }) -join " AND "
            $faltan = "(SELECT COUNT(*) FROM $(& $rT $t) r LEFT JOIN $(& $cT $t) c ON $on WHERE c.$(Ident $pkR[0]) IS NULL)"
            $colis  = if ($clave) { "(SELECT COUNT(*) FROM $(& $rT $t) r JOIN $(& $cT $t) c ON $on WHERE NOT (r.$(Ident $clave) <=> c.$(Ident $clave)))" } else { "-1" }
        } else {
            $obj.Nota = "sin llave comparable"
            $faltan = "-1"; $colis = "-1"
        }
        [void]$sql.AppendLine("SELECT '$t', $cuentaR, $cuentaC, $faltan, $colis;")
    }
    if ($sql.Length -gt 0) {
        foreach ($f in (A-Filas (Consultar $sql.ToString()))) {
            $o = $resultado | Where-Object { $_.Tabla -eq $f[0] } | Select-Object -First 1
            if ($o) { $o.Respaldo = [int64]$f[1]; $o.Hoy = [int64]$f[2]; $o.Faltan = [int64]$f[3]; $o.Colisiones = [int64]$f[4] }
        }
    }
    return ,$resultado
}

function Mostrar-Comparacion {
    param($Res)
    $filas = @()
    foreach ($o in $Res) {
        $col = if ($o.Colisiones -lt 0) { "-" } else { [string]$o.Colisiones }
        $fal = if ($o.Faltan -lt 0) { "-" } else { [string]$o.Faltan }
        $marca = ""
        if ($o.Nota) { $marca = $o.Nota }
        elseif ($o.Colisiones -gt 0) { $marca = "<< MISMO NUMERO, OTRO DATO" }
        elseif ($o.Faltan -gt 0) { $marca = "<< faltan hoy" }
        $filas += ,@($o.Tabla, [string]$o.Respaldo, [string]$o.Hoy, $fal, $col, $marca)
    }
    Imprimir-Tabla -Encabezado @("tabla", "respaldo", "hoy", "faltan", "choques", "") -Filas $filas
    Escribir ""
    Escribir "      respaldo = filas antes de actualizar   hoy = filas ahora"
    Escribir "      faltan   = filas del respaldo que hoy ya no estan (por numero de registro)"
    Escribir "      choques  = mismo numero de registro pero con otra fecha de creacion: la base"
    Escribir "                 se reinicio y los numeros se volvieron a usar (no se importa solo)"
}

function Es-Importable-Solo {
    param([string]$Tabla)
    if ($NO_IMPORTAR_SOLAS -contains $Tabla) { return $false }
    if ($Tabla -match $PATRON_CONFIG) { return $false }
    return $true
}

# Las mismas opciones con que se corrio (para el comando "Para aplicarlo"), asi
# una prueba sobre pos_ensayo_* nunca sugiere aplicar sobre la base real.
function Opciones-Repetidas {
    $o = ""
    if ($InstallDir -ne "C:\POS-iaDoS") { $o += " -InstallDir `"$InstallDir`"" }
    if ($script:RespaldoDado) { $o += " -Respaldo `"$script:RespaldoDado`"" }
    if ($script:BaseDada)     { $o += " -Base $script:BaseDada" }
    if ($script:ActualDada)   { $o += " -BaseActual $script:ActualDada" }
    if ($Tablas)              { $o += " -Tablas $Tablas" }
    if ($Usuarios)            { $o += " -Usuarios $Usuarios" }
    if ($Tienda -gt 0)        { $o += " -Tienda $Tienda" }
    return $o
}

function Tomar-Respaldo {
    param([string]$Etiqueta)
    if (-not (Test-Path $RESPALDAR)) { Terminar 1 "No existe $RESPALDAR; sin respaldo previo no se cambia nada." }
    if ($BaseActual -ne $dbName) { Aviso "MODO PRUEBA: respaldar.ps1 respalda $dbName, no $BaseActual" }
    Escribir "        Tomando respaldo completo ($Etiqueta): base, imagenes, Excel y ajustes. Puede tardar."
    $inicio = (Get-Date).AddSeconds(-5)
    $eap = $ErrorActionPreference; $ErrorActionPreference = "Continue"
    try {
        $sal = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $RESPALDAR -InstallDir $InstallDir -Etiqueta $Etiqueta -NoDetenerServicio -Silencioso 2>&1
        $codigo = $LASTEXITCODE
    } finally { $ErrorActionPreference = $eap }
    foreach ($l in @($sal)) { $txt = [string]$l; if ($txt.Trim() -ne "") { Escribir "        | $txt" } }
    $carpeta = Get-ChildItem -Path $BACKUPS -Directory -ErrorAction SilentlyContinue |
               Where-Object { $_.Name -like "*-$Etiqueta-*" -and $_.CreationTime -ge $inicio } |
               Sort-Object Name -Descending | Select-Object -First 1
    if ($codigo -ne 0 -or -not $carpeta) { Terminar 1 "El respaldo previo fallo (codigo $codigo). No se cambio nada." }
    $sqlR = Join-Path $carpeta.FullName "base-datos.sql"
    if (-not (Test-Path $sqlR) -or (Get-Item $sqlR).Length -lt 1024) { Terminar 1 "El respaldo previo no trae base-datos.sql. No se cambio nada." }
    Ok "Respaldo previo: $($carpeta.FullName) ($(Tamano-Legible (Get-Item $sqlR).Length))"
    return $carpeta.FullName
}

# =============================================================================
#  PASO: REVISAR (solo lectura)
# =============================================================================
function Probar-EnVivo {
    param($Tiendas, $UsuariosFilas)
    if (-not (Test-Path $NODE)) { Aviso "No esta node.exe; se omiten las pruebas en vivo"; return }
    $casos = @()
    $reales = @($Tiendas | ForEach-Object { $_[0] })
    $sa = $UsuariosFilas | Where-Object { $_[3] -eq "superadmin" -and $_[7] -eq "1" } | Select-Object -First 1
    if ($sa) {
        $casos += [pscustomobject]@{ etiqueta = "superadmin $($sa[1]) SIN elegir tienda"; id = [int]$sa[0]; email = $sa[1]; rol = $sa[3]; tenant_id = $sa[4]; empresa_id = $sa[5]; tienda_id = $sa[6]; ver = $null; publico = $false }
        foreach ($t in ($Tiendas | Select-Object -First 3)) {
            $casos += [pscustomobject]@{ etiqueta = "superadmin eligiendo la tienda $($t[0]) ($($t[3]))"; id = [int]$sa[0]; email = $sa[1]; rol = $sa[3]; tenant_id = $sa[4]; empresa_id = $sa[5]; tienda_id = $sa[6]; ver = @{ t = [int]$t[1]; e = [int]$t[2]; s = [int]$t[0] }; publico = $false }
        }
    }
    foreach ($rol in @("admin", "cajero")) {
        $u = $UsuariosFilas | Where-Object { $_[3] -eq $rol -and $_[7] -eq "1" -and $reales -contains $_[6] } | Select-Object -First 1
        if ($u) { $casos += [pscustomobject]@{ etiqueta = "$rol $($u[1]) (tienda $($u[6]))"; id = [int]$u[0]; email = $u[1]; rol = $u[3]; tenant_id = $u[4]; empresa_id = $u[5]; tienda_id = $u[6]; ver = $null; publico = $false } }
    }
    $tiendasLogin = @($reales) + @($UsuariosFilas | ForEach-Object { $_[6] } | Where-Object { $_ -match '^\d+$' }) | Select-Object -Unique
    foreach ($s in $tiendasLogin) { $casos += [pscustomobject]@{ etiqueta = ""; id = 0; email = ""; rol = ""; tenant_id = 0; empresa_id = 0; tienda_id = [int]$s; ver = $null; publico = $true } }

    $jsCasos = Archivo-Temporal ".json"
    Set-TextoSinBOM -Ruta $jsCasos -Texto (ConvertTo-Json -InputObject @($casos) -Depth 4)
    $js = Archivo-Temporal ".js"
    Set-TextoSinBOM -Ruta $js -Texto @'
const fs = require('fs');
const path = require('path');
const [installDir, port, casosRuta] = process.argv.slice(2);
let jwt;
try { jwt = require(path.join(installDir, 'backend', 'node_modules', 'jsonwebtoken')); }
catch (e) { console.log('    !   No se encontro jsonwebtoken en el backend; se omiten las pruebas.'); process.exit(0); }
const env = fs.readFileSync(path.join(installDir, 'backend', '.env'), 'utf8');
const m = env.match(/^\s*JWT_SECRET\s*=\s*(.*)$/m);
const secreto = m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
if (!secreto) { console.log('    !   El .env no trae JWT_SECRET; se omiten las pruebas.'); process.exit(0); }
const casos = JSON.parse(fs.readFileSync(casosRuta, 'utf8'));
function resumir(status, cuerpo, publico) {
  if (cuerpo === '') return `${status} vacio`;
  let j; try { j = JSON.parse(cuerpo); } catch { return `${status} ${String(cuerpo).slice(0, 120)}`; }
  const lista = Array.isArray(j) ? j : (j && Array.isArray(j.data) ? j.data : null);
  if (lista && publico) return `${lista.length} usuarios: ` + lista.slice(0, 12).map((u) => `${u.nombre} (${u.rol})`).join(', ');
  if (lista) {
    const tiendas = [...new Set(lista.map((x) => x && x.tienda_id).filter((x) => x !== undefined))];
    return `${status} ${lista.length} filas` + (tiendas.length ? ` (tiendas: ${tiendas.join(',')})` : '');
  }
  if (j === null) return `${status} vacio (no hay)`;
  if (j && j.id !== undefined) return `${status} id=${j.id}` + (j.nombre ? ` "${j.nombre}"` : '') + (j.tienda_id !== undefined ? ` tienda=${j.tienda_id}` : '') + (j.estado ? ` estado=${j.estado}` : '');
  if (j && j.message) return `${status} "${Array.isArray(j.message) ? j.message.join('; ') : j.message}"`;
  return `${status} ${JSON.stringify(j).slice(0, 120)}`;
}
async function llamar(token, ruta, extra, publico) {
  try {
    const h = { ...(extra || {}) };
    if (token) h.Authorization = `Bearer ${token}`;
    const r = await fetch(`http://127.0.0.1:${port}/api${ruta}`, { headers: h, signal: AbortSignal.timeout(15000) });
    return resumir(r.status, await r.text(), publico);
  } catch (e) { return `sin respuesta (${e.message})`; }
}
(async () => {
  for (const c of casos) {
    if (c.publico) { console.log(`    Tarjetas del login para la tienda ${c.tienda_id}: ${await llamar(null, '/auth/tienda-users?tienda_id=' + c.tienda_id, null, true)}`); continue; }
    const token = jwt.sign({ sub: c.id, email: c.email, rol: c.rol, tenant_id: c.tenant_id, empresa_id: c.empresa_id, tienda_id: c.tienda_id }, secreto, { expiresIn: '5m' });
    const h = c.ver ? { 'x-view-tenant-id': String(c.ver.t), 'x-view-empresa-id': String(c.ver.e), 'x-view-tienda-id': String(c.ver.s) } : {};
    console.log(`    ${c.etiqueta}`);
    for (const ruta of ['/caja/activa', '/caja', '/ventas', '/users']) console.log(`        GET ${ruta.padEnd(13)} ${await llamar(token, ruta, h, false)}`);
  }
})().catch((e) => { console.log('    !   Las pruebas fallaron: ' + e.message); });
'@
    $eap = $ErrorActionPreference; $ErrorActionPreference = "Continue"
    try { $sal = & $NODE $js $InstallDir $appPort $jsCasos 2>&1 } finally { $ErrorActionPreference = $eap }
    foreach ($l in @($sal)) { $txt = [string]$l; if ($txt.Trim() -ne "") { Escribir $txt } }
}

function Paso-Revisar {
    Preparar-Conexion

    Titulo "[1/11] Programa y servicios"
    $vj = Join-Path $InstallDir "version.json"
    if (Test-Path $vj) {
        try {
            $v = Get-Content $vj -Raw -Encoding UTF8 | ConvertFrom-Json
            Escribir "      Version instalada: $($v.version)   previa: $($v.version_previa)   fecha: $($v.build_date)"
            if ($v.respaldo) { Escribir "      Respaldo de la ultima actualizacion: $($v.respaldo)" }
        } catch { Aviso "version.json no se pudo leer" }
    }
    foreach ($s in @("PosIaDos-Backend", "PosIaDos-MariaDB")) {
        $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
        if ($svc) { if ($svc.Status -eq "Running") { Ok "$s esta corriendo" } else { Problema "El servicio $s esta $($svc.Status)" } }
        else { Aviso "No existe el servicio $s" }
    }
    $script:BackendVivo = $false
    try {
        $h = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 -Uri "http://127.0.0.1:$appPort/api/health"
        if ($h.StatusCode -eq 200) { Ok "El backend responde en el puerto $appPort"; $script:BackendVivo = $true }
    } catch { Problema "El backend NO responde en http://127.0.0.1:$appPort/api/health" }
    foreach ($k in @("INSTALL_MODE", "APP_PORT", "DB_HOST", "DB_PORT", "DB_DATABASE", "NODE_ENV", "TZ")) {
        if ($cfg.ContainsKey($k)) { Escribir "      .env  $k=$($cfg[$k])" }
    }
    $ua = Join-Path $InstallDir "logs\ultima-actualizacion.txt"
    if (Test-Path $ua) { Escribir "      Ultima actualizacion:"; foreach ($l in (Get-Content $ua -Encoding UTF8 -TotalCount 8)) { Escribir "        $l" } }

    Titulo "[2/11] Empresas y tiendas"
    Imprimir-Tabla -Encabezado @("tenant", "nombre", "activo") -Filas (A-Filas (Consultar "SELECT id, nombre, activo FROM tenants ORDER BY id;" $BaseActual))
    Escribir ""
    Imprimir-Tabla -Encabezado @("empresa", "tenant", "nombre", "activo") -Filas (A-Filas (Consultar "SELECT id, tenant_id, nombre, activo FROM empresas ORDER BY id;" $BaseActual))
    Escribir ""
    $tiendas = A-Filas (Consultar "SELECT id, tenant_id, empresa_id, nombre, activo FROM tiendas ORDER BY id;" $BaseActual)
    Imprimir-Tabla -Encabezado @("tienda", "tenant", "empresa", "nombre", "activo") -Filas $tiendas
    $idsTiendas = @($tiendas | ForEach-Object { $_[0] })
    if ($tiendas.Count -eq 1) { Ok "Una sola tienda: la $($tiendas[0][0]) ($($tiendas[0][3]))" }

    Titulo "[3/11] Usuarios (sin contrasenas)"
    $cu = Columnas $BaseActual "users"
    $pin  = if ($cu -contains "pin") { "IF(u.pin IS NULL OR u.pin='', 'no', 'si')" } else { "'-'" }
    $ult  = if ($cu -contains "ultimo_login") { "IFNULL(DATE_FORMAT(u.ultimo_login,'%Y-%m-%d %H:%i'),'-')" } else { "'-'" }
    $usuariosF = A-Filas (Consultar ("SELECT u.id, u.email, u.nombre, u.rol, IFNULL(u.tenant_id,'NULL'), IFNULL(u.empresa_id,'NULL'), IFNULL(u.tienda_id,'NULL'), u.activo, $pin, $ult, " +
        "DATE_FORMAT(u.created_at,'%Y-%m-%d %H:%i'), IF(t.id IS NULL, 'NO EXISTE', 'ok') FROM users u LEFT JOIN tiendas t ON t.id=u.tienda_id ORDER BY u.id;") $BaseActual)
    Imprimir-Tabla -Encabezado @("id", "email", "nombre", "rol", "ten", "emp", "tda", "act", "pin", "ultimo login", "creado", "tienda") -Filas $usuariosF
    $sinTienda = @($usuariosF | Where-Object { $_[3] -ne "superadmin" -and $_[6] -eq "NULL" })
    $fuera     = @($usuariosF | Where-Object { $_[3] -ne "superadmin" -and $_[6] -ne "NULL" -and $_[11] -ne "ok" })
    if ($sinTienda.Count -gt 0) {
        Problema ("$($sinTienda.Count) usuario(s) SIN tienda (se crearon con 'Sin tienda asignada'); no salen en el login ni entran con PIN: id " + (($sinTienda | ForEach-Object { $_[0] }) -join ", ") + ". Ver -Paso Unificar -Usuarios")
    }
    if ($fuera.Count -gt 0) {
        Problema ("$($fuera.Count) usuario(s) en una tienda que no existe; no salen en el login de la tienda real: id " + (($fuera | ForEach-Object { $_[0] }) -join ", ") + ". Ver -Paso Unificar -Usuarios")
    }
    $demo = @($sinTienda + $fuera | Where-Object { $_[1] -match '@iados\.mx$' })
    if ($demo.Count -gt 0) {
        Escribir ("      De esos, los @iados.mx (id " + (($demo | ForEach-Object { $_[0] }) -join ", ") + ") son de demostracion de la instalacion: no hace falta moverlos.")
    }
    foreach ($s in $idsTiendas) {
        $n = @($usuariosF | Where-Object { $_[6] -eq $s -and $_[7] -eq "1" }).Count
        Escribir "      Usuarios activos en la tienda ${s}: $n"
    }
    $sa = @($usuariosF | Where-Object { $_[3] -eq "superadmin" })
    if ($sa.Count -gt 0) {
        Aviso "Desde la v2.4 el superadmin NO trae tienda propia: en el POS, caja y reportes primero hay que elegir la tienda arriba ('Elegir tienda...'). Si no, abrir caja marca error."
    }

    Titulo "[4/11] Ventas por tienda"
    $ventas = A-Filas (Consultar ("SELECT IFNULL(v.tenant_id,'NULL'), IFNULL(v.empresa_id,'NULL'), IFNULL(v.tienda_id,'NULL'), IFNULL(t.nombre,'** NO EXISTE **'), COUNT(*), " +
        "DATE_FORMAT(MIN(v.created_at),'%Y-%m-%d'), DATE_FORMAT(MAX(v.created_at),'%Y-%m-%d %H:%i'), ROUND(SUM(v.total),2) " +
        "FROM ventas v LEFT JOIN tiendas t ON t.id=v.tienda_id GROUP BY v.tenant_id, v.empresa_id, v.tienda_id, t.nombre ORDER BY 3;") $BaseActual)
    Imprimir-Tabla -Encabezado @("ten", "emp", "tda", "tienda", "ventas", "primera", "ultima", "total $") -Filas $ventas
    foreach ($f in $ventas) {
        if ($f[3] -eq "** NO EXISTE **") { Problema "$($f[4]) venta(s) en la tienda '$($f[2])' que no existe (del $($f[5]) al $($f[6])): no se ven en reportes. Ver -Paso Unificar" }
    }
    Escribir ""
    Escribir "      Ventas de los ultimos 14 dias:"
    Imprimir-Tabla -Encabezado @("dia", "tda", "ventas", "total $") -Filas (A-Filas (Consultar ("SELECT DATE(created_at), IFNULL(tienda_id,'NULL'), COUNT(*), ROUND(SUM(total),2) FROM ventas " +
        "WHERE created_at >= NOW() - INTERVAL 14 DAY GROUP BY DATE(created_at), tienda_id ORDER BY 1, 2;") $BaseActual))

    Titulo "[5/11] Cajas"
    $cajas = A-Filas (Consultar ("SELECT IFNULL(c.tienda_id,'NULL'), IFNULL(t.nombre,'** NO EXISTE **'), COUNT(*), SUM(c.estado='abierta'), " +
        "DATE_FORMAT(MIN(c.fecha_apertura),'%Y-%m-%d'), DATE_FORMAT(MAX(c.fecha_apertura),'%Y-%m-%d %H:%i') " +
        "FROM cajas c LEFT JOIN tiendas t ON t.id=c.tienda_id GROUP BY c.tienda_id, t.nombre ORDER BY 1;") $BaseActual)
    Imprimir-Tabla -Encabezado @("tda", "tienda", "cajas", "abiertas", "primera", "ultima") -Filas $cajas
    foreach ($f in $cajas) {
        if ($f[1] -eq "** NO EXISTE **") { Problema "$($f[2]) caja(s) en la tienda '$($f[0])' que no existe. Ver -Paso Unificar" }
        if ($f[3] -match '^\d+$' -and [int]$f[3] -gt 1) { Problema "La tienda $($f[0]) tiene $($f[3]) cajas abiertas a la vez" }
    }
    Escribir ""
    Escribir "      Cajas abiertas ahora:"
    Imprimir-Tabla -Encabezado @("id", "nombre", "tda", "usuario", "abierta desde") -Filas (A-Filas (Consultar ("SELECT c.id, c.nombre, IFNULL(c.tienda_id,'NULL'), IFNULL(u.email, c.usuario_id), DATE_FORMAT(c.fecha_apertura,'%Y-%m-%d %H:%i') " +
        "FROM cajas c LEFT JOIN users u ON u.id=c.usuario_id WHERE c.estado='abierta' ORDER BY c.id;") $BaseActual))
    Escribir ""
    Escribir "      Ultimas 8 cajas:"
    Imprimir-Tabla -Encabezado @("id", "nombre", "tda", "estado", "apertura", "cierre", "ventas $") -Filas (A-Filas (Consultar ("SELECT id, nombre, IFNULL(tienda_id,'NULL'), estado, DATE_FORMAT(fecha_apertura,'%Y-%m-%d %H:%i'), " +
        "IFNULL(DATE_FORMAT(fecha_cierre,'%Y-%m-%d %H:%i'),'-'), total_ventas FROM cajas ORDER BY id DESC LIMIT 8;") $BaseActual))

    Titulo "[6/11] Otros registros fuera de tienda"
    $hayFuera = $false
    foreach ($t in $TABLAS_UNIFICAR) {
        if ($t -in @("ventas", "cajas")) { continue }
        $ct = Columnas $BaseActual $t
        if ($ct -notcontains "tienda_id") { continue }
        $n = Uno "SELECT COUNT(*) FROM $(Ident $t) WHERE tienda_id IS NULL OR tienda_id NOT IN (SELECT id FROM tiendas);" $BaseActual
        if ($n -ne "0") { $hayFuera = $true; Problema "${t}: $n registro(s) en una tienda que no existe" }
    }
    if (-not $hayFuera) { Ok "Pedidos, devoluciones, cotizaciones y movimientos: todos en una tienda que existe" }

    Titulo "[7/11] Licencia (sin claves)"
    $cl = Columnas $BaseActual "licencias"
    $campos = @("id", "tenant_id", "plan", "estado", "fecha_inicio", "fecha_fin", "permanente", "machine_locked") | Where-Object { $cl -contains $_ }
    Imprimir-Tabla -Encabezado $campos -Filas (A-Filas (Consultar ("SELECT " + (($campos | ForEach-Object { "IFNULL($(Ident $_),'NULL')" }) -join ", ") + " FROM licencias ORDER BY id;") $BaseActual))

    Titulo "[8/11] Filas por tabla"
    $nombresT = Consultar "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='$BaseActual' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;"; $lista = @($nombresT | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ })
    if ($lista.Count -gt 0) {
        $q = ($lista | ForEach-Object { "SELECT '$_', COUNT(*) FROM $(Ident $_)" }) -join " UNION ALL "
        $conteo = A-Filas (Consultar "$q;" $BaseActual)
        $filas = @(); $i = 0
        while ($i -lt $conteo.Count) {
            $fila = @()
            for ($k = 0; $k -lt 3; $k++) { if ($i + $k -lt $conteo.Count) { $fila += $conteo[$i + $k][0]; $fila += $conteo[$i + $k][1] } else { $fila += ""; $fila += "" } }
            $filas += ,$fila; $i += 3
        }
        Imprimir-Tabla -Encabezado @("tabla", "filas", "tabla", "filas", "tabla", "filas") -Filas $filas
    }

    Titulo "[9/11] Bitacora del backend (errores recientes, sin datos sensibles)"
    $hayLog = $false
    foreach ($nom in @("backend-stderr.log", "backend-stdout.log")) {
        $f = Join-Path $InstallDir "logs\$nom"
        if (-not (Test-Path $f)) { continue }
        $hayLog = $true
        $lineas = @(Get-Content -Path $f -Tail 4000 -Encoding UTF8 -ErrorAction SilentlyContinue |
            Where-Object { $_ -match '(?i)error|exception|caja|QueryFailed|ER_[A-Z_]+' -and $_ -notmatch '(?i)password|secret|token|\$2[aby]\$|authorization' } |
            Select-Object -Last 25)
        Escribir "      $nom ($(Tamano-Legible (Get-Item $f).Length)), ultimas $($lineas.Count) lineas con error/caja:"
        foreach ($l in $lineas) { $t = ($l -replace '\x1b\[[0-9;]*m', ''); if ($t.Length -gt 210) { $t = $t.Substring(0, 209) + "~" }; Escribir "        $t" }
    }
    if (-not $hayLog) { Aviso "No se encontraron bitacoras del backend en $InstallDir\logs" }

    Titulo "[10/11] Respaldos"
    $resps = Listar-Respaldos
    $filasR = @()
    foreach ($r in $resps) {
        $sqlTxt = if ($r.Sql -gt 0) { Tamano-Legible $r.Sql } else { "NO TRAE BASE" }
        $img = if (Test-Path (Join-Path $r.Ruta "uploads")) { "si" } else { "no" }
        $filasR += ,@($r.Nombre, $sqlTxt, $img)
    }
    Imprimir-Tabla -Encabezado @("carpeta", "base-datos.sql", "imagenes") -Filas $filasR
    $util = @($resps | Where-Object { $_.Sql -gt 1024 -and $_.Nombre -match 'preactualizacion|manual' })
    if ($util.Count -gt 0) { Ok "Para comparar se usaria: $($util[0].Nombre)" } else { Problema "No hay un respaldo de antes de actualizar con base de datos" }

    Titulo "[11/11] Navegador"
    $progId = $null
    try { $progId = (Get-ItemProperty "HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice" -ErrorAction Stop).ProgId } catch { }
    Escribir "      Navegador predeterminado: $(if ($progId) { $progId } else { 'desconocido' })"
    $chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
    Escribir "      Chrome instalado: $(if ($chrome) { 'si' } else { 'no' })"
    $abrir = Join-Path $InstallDir "abrir-pos.ps1"
    if ((Test-Path $abrir) -and (Select-String -Path $abrir -Pattern 'chrome' -Quiet) -and $chrome) {
        Escribir "      El acceso directo del POS abre Chrome."
        if ($progId -and $progId -notmatch 'Chrome') {
            Aviso "Antes el POS abria en el navegador predeterminado ($progId) y ahora en Chrome. Chrome empieza sin la tienda registrada: en el login usar 'Cambiar tienda' y elegir la tienda una vez."
        }
    }

    if (-not $SinPruebas -and $script:BackendVivo) {
        Titulo "Prueba en vivo: lo que ve cada usuario (solo lectura)"
        Probar-EnVivo -Tiendas $tiendas -UsuariosFilas $usuariosF
    }

    $codigo = if ($script:Problemas.Count -gt 0) { 2 } else { 0 }
    Terminar $codigo "Revision terminada. No se cambio nada. Siguiente: -Paso Comparar"
}

# =============================================================================
#  PASO: COMPARAR
# =============================================================================
function Paso-Comparar {
    Titulo "[1/3] Conectando"
    Preparar-Conexion -PreferirRoot
    Titulo "[2/3] Cargando el respaldo de antes de actualizar en una base aparte"
    $lr = Listar-Respaldos; $resps = @($lr | Where-Object { $_.Sql -gt 0 })
    foreach ($r in $resps) { Escribir "        $($r.Nombre)  ($(Tamano-Legible $r.Sql))" }
    if ($Base -ne "") { $rec = Base-Recuperada } else { $rec = Cargar-Respaldo (Elegir-Respaldo) }
    Titulo "[3/3] Comparando $rec (respaldo) contra $BaseActual (hoy)"
    $res = Comparar-Bases -Rec $rec -Cur $BaseActual
    Mostrar-Comparacion $res
    $csv = Join-Path $InstallDir "logs\comparacion-$sello.csv"
    try {
        $res | Select-Object Tabla, Respaldo, Hoy, Faltan, Colisiones, Nota | Export-Csv -Path $csv -NoTypeInformation -Encoding UTF8
        Escribir "      Tabla completa en $csv"
    } catch { }
    $faltan   = @($res | Where-Object { $_.Faltan -gt 0 })
    $choques  = @($res | Where-Object { $_.Colisiones -gt 0 })
    $perdidas = @($res | Where-Object { $_.Nota -eq "YA NO EXISTE HOY" })
    Escribir ""
    foreach ($o in $perdidas) { Problema "La tabla $($o.Tabla) estaba en el respaldo y hoy no existe" }
    foreach ($o in $choques)  { Problema "$($o.Tabla): $($o.Colisiones) registro(s) con el mismo numero pero otra fecha (la base se reinicio). No se importan solos: mandar este reporte" }
    if ($faltan.Count -eq 0 -and $choques.Count -eq 0) {
        Ok "No falta NADA del respaldo: todo lo de antes de actualizar sigue en la base."
        Escribir "      Si no se ven historicos o usuarios, es por la tienda con la que se entra, no por datos perdidos."
        Escribir "      Revisa el paso Revisar (ventas o usuarios en una tienda que no existe) y usa -Paso Unificar."
        Terminar 0 "Comparacion terminada. La base real no se toco. Copia aparte: $rec"
    }
    foreach ($o in $faltan) {
        $sola = if (Es-Importable-Solo $o.Tabla) { "" } else { " (es estado, no historia: solo con -Tablas $($o.Tabla))" }
        Problema "$($o.Tabla): faltan $($o.Faltan) registro(s) del respaldo$sola"
    }
    Terminar 2 "Comparacion terminada. La base real no se toco. Siguiente: -Paso Importar (simulacion) y luego -Paso Importar -Confirmar"
}

# =============================================================================
#  PASO: IMPORTAR (solo agrega lo que falta)
# =============================================================================
function Paso-Importar {
    Titulo "[1/5] Conectando"
    Preparar-Conexion -PreferirRoot
    Titulo "[2/5] Copia del respaldo"
    $rec = Base-Recuperada
    Titulo "[3/5] Que falta hoy"
    $res = Comparar-Bases -Rec $rec -Cur $BaseActual
    $pedidas = @($Tablas -split '[,; ]+' | Where-Object { $_ -ne "" })
    $plan = @(); $fuera = @()
    foreach ($o in ($res | Where-Object { $_.Faltan -gt 0 })) {
        if ($pedidas.Count -gt 0 -and $pedidas -notcontains $o.Tabla) { continue }
        if ($o.Colisiones -gt 0)          { $fuera += ,@($o.Tabla, [string]$o.Faltan, "$($o.Colisiones) choque(s) de numero; revisar a mano"); continue }
        if ($pedidas.Count -eq 0 -and -not (Es-Importable-Solo $o.Tabla)) { $fuera += ,@($o.Tabla, [string]$o.Faltan, "es estado, no historia: pedirla con -Tablas $($o.Tabla)"); continue }
        $plan += $o
    }
    foreach ($p in $pedidas) { if (-not ($res | Where-Object { $_.Tabla -eq $p })) { Aviso "La tabla '$p' no existe en el respaldo" } }
    # Una tabla cuyo padre se queda fuera tampoco entra: si no, quedarian
    # detalles o pagos sin su venta.
    $fks = A-Filas (Consultar "SELECT TABLE_NAME, REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='$BaseActual' AND REFERENCED_TABLE_NAME IS NOT NULL AND REFERENCED_TABLE_NAME <> TABLE_NAME;")
    do {
        $cambio = $false
        $fueraN = @($fuera | ForEach-Object { $_[0] })
        foreach ($o in @($plan)) {
            $padre = $fks | Where-Object { $_[0] -eq $o.Tabla -and $fueraN -contains $_[1] } | Select-Object -First 1
            if ($padre) {
                $fuera += ,@($o.Tabla, [string]$o.Faltan, "depende de $($padre[1]), que no se importa")
                $plan = @($plan | Where-Object { $_.Tabla -ne $o.Tabla })
                $cambio = $true
            }
        }
    } while ($cambio)
    if ($plan.Count -eq 0) {
        Ok "No hay nada que importar."
        if ($fuera.Count -gt 0) {
            Escribir ""; Escribir "      No se importan solas:"; Imprimir-Tabla -Encabezado @("tabla", "faltan", "por que") -Filas $fuera
            Terminar 2 "No se importo nada: lo que falta hay que revisarlo a mano (tabla de arriba). La base $BaseActual no se toco."
        }
        Terminar 0 "Nada que importar. La base $BaseActual no se toco."
    }
    $total = ($plan | Measure-Object -Property Faltan -Sum).Sum
    Escribir "      Se agregarian $total registro(s) que estaban antes de actualizar y hoy no estan:"
    Imprimir-Tabla -Encabezado @("tabla", "se agregan", "hoy hay") -Filas @($plan | ForEach-Object { ,@($_.Tabla, [string]$_.Faltan, [string]$_.Hoy) })
    if ($fuera.Count -gt 0) { Escribir ""; Escribir "      No se importan:"; Imprimir-Tabla -Encabezado @("tabla", "faltan", "por que") -Filas $fuera }
    Escribir "      Lo que ya esta hoy NO se cambia ni se borra; solo se agregan las filas que faltan."
    if (-not $Confirmar) {
        Escribir ""
        Escribir "      Para aplicarlo:" "Cyan"
        Escribir "      powershell -NoProfile -ExecutionPolicy Bypass -File $($MyInvocation.ScriptName) -Paso Importar -Confirmar$(Opciones-Repetidas)" "Cyan"
        Terminar 2 "SIMULACION: no se cambio nada."
    }

    Titulo "[4/5] Respaldo antes de tocar la base"
    $previo = Tomar-Respaldo -Etiqueta "prereparacion"
    $carpeta = Join-Path $InstallDir "logs\reparacion-$sello"
    New-Item -ItemType Directory -Path $carpeta -Force | Out-Null
    # Que registros exactamente se agregan, y un .sql que quita SOLO esos.
    $deshacer = New-Object System.Text.StringBuilder
    [void]$deshacer.AppendLine("-- Quita SOLO los registros que agrego REPARAR-MARISCOS el $sello en $BaseActual.")
    [void]$deshacer.AppendLine("-- Lo normal para regresar es revertir.ps1 con el respaldo $previo")
    [void]$deshacer.AppendLine("SET SESSION FOREIGN_KEY_CHECKS=0;")
    foreach ($o in $plan) {
        $on = ($o.Pk | ForEach-Object { "r.$(Ident $_) <=> c.$(Ident $_)" }) -join " AND "
        $sel = ($o.Pk | ForEach-Object { "r.$(Ident $_)" }) -join ", "
        $ids = A-Filas (Consultar "SELECT $sel FROM $(Ident $rec).$(Ident $o.Tabla) r LEFT JOIN $(Ident $BaseActual).$(Ident $o.Tabla) c ON $on WHERE c.$(Ident $o.Pk[0]) IS NULL;")
        $csvLineas = @(($o.Pk -join ",")) + @($ids | ForEach-Object { $_ -join "," })
        Set-TextoSinBOM -Ruta (Join-Path $carpeta "$($o.Tabla).csv") -Texto $csvLineas
        $tuplas = @($ids | ForEach-Object { if ($o.Pk.Count -eq 1) { Valor-Sql $_[0] } else { "(" + (($_ | ForEach-Object { Valor-Sql $_ }) -join ",") + ")" } })
        $colPk = if ($o.Pk.Count -eq 1) { Ident $o.Pk[0] } else { "(" + (($o.Pk | ForEach-Object { Ident $_ }) -join ",") + ")" }
        for ($i = 0; $i -lt $tuplas.Count; $i += 500) {
            $trozo = $tuplas[$i..([Math]::Min($i + 499, $tuplas.Count - 1))] -join ","
            [void]$deshacer.AppendLine("DELETE FROM $(Ident $o.Tabla) WHERE $colPk IN ($trozo);")
        }
    }
    [void]$deshacer.AppendLine("SET SESSION FOREIGN_KEY_CHECKS=1;")
    $rutaDeshacer = Join-Path $carpeta "deshacer-importar.sql"
    Set-TextoSinBOM -Ruta $rutaDeshacer -Texto $deshacer.ToString()
    Ok "Lista de lo que se agrega y archivo para deshacer en $carpeta"

    Titulo "[5/5] Agregando lo que falta (todo o nada)"
    $sql = New-Object System.Text.StringBuilder
    [void]$sql.AppendLine("SET SESSION FOREIGN_KEY_CHECKS=0;")
    [void]$sql.AppendLine("START TRANSACTION;")
    foreach ($o in $plan) {
        $on = ($o.Pk | ForEach-Object { "r.$(Ident $_) <=> c.$(Ident $_)" }) -join " AND "
        $lista = ($o.Comunes | ForEach-Object { Ident $_ }) -join ", "
        $listaR = ($o.Comunes | ForEach-Object { "r.$(Ident $_)" }) -join ", "
        [void]$sql.AppendLine("INSERT IGNORE INTO $(Ident $BaseActual).$(Ident $o.Tabla) ($lista) SELECT $listaR FROM $(Ident $rec).$(Ident $o.Tabla) r LEFT JOIN $(Ident $BaseActual).$(Ident $o.Tabla) c ON $on WHERE c.$(Ident $o.Pk[0]) IS NULL;")
        [void]$sql.AppendLine("SELECT '$($o.Tabla)', ROW_COUNT();")
    }
    [void]$sql.AppendLine("COMMIT;")
    [void]$sql.AppendLine("SET SESSION FOREIGN_KEY_CHECKS=1;")
    $hecho = A-Filas (Consultar $sql.ToString())
    $filas = @(); $incompletas = 0
    foreach ($o in $plan) {
        $h = $hecho | Where-Object { $_[0] -eq $o.Tabla } | Select-Object -First 1
        $n = if ($h) { [int64]$h[1] } else { 0 }
        if ($n -ne $o.Faltan) { $incompletas++ }
        $filas += ,@($o.Tabla, [string]$o.Faltan, [string]$n, $(if ($n -eq $o.Faltan) { "ok" } else { "NO ENTRARON TODOS" }))
    }
    Imprimir-Tabla -Encabezado @("tabla", "esperados", "agregados", "") -Filas $filas
    $despues = Comparar-Bases -Rec $rec -Cur $BaseActual
    foreach ($o in $plan) {
        $d = $despues | Where-Object { $_.Tabla -eq $o.Tabla } | Select-Object -First 1
        if ($d -and $d.Faltan -gt 0) { Problema "$($o.Tabla): todavia faltan $($d.Faltan) (chocan con un dato unico que ya existe hoy). Ver $carpeta" }
    }
    Escribir ""
    Escribir "      Para regresar TODO como estaba antes de importar:" "Cyan"
    Escribir "      powershell -NoProfile -ExecutionPolicy Bypass -File $REVERTIR -Respaldo `"$previo`" -SoloBaseDeDatos" "Cyan"
    Escribir "      (o quitar solo lo agregado con $rutaDeshacer)"
    if ($incompletas -gt 0) { Terminar 2 "Importacion aplicada con pendientes. Respaldo previo: $previo" }
    Terminar 0 "Importacion aplicada. Respaldo previo: $previo"
}

# =============================================================================
#  PASO: UNIFICAR (mover a la tienda real lo que quedo fuera)
# =============================================================================
function Paso-Unificar {
    Titulo "[1/4] Conectando"
    Preparar-Conexion
    $tiendas = A-Filas (Consultar "SELECT id, tenant_id, empresa_id, nombre FROM tiendas ORDER BY id;" $BaseActual)
    if ($tiendas.Count -eq 0) { Terminar 1 "No hay tiendas en la base; no se cambio nada." }
    $destino = $null
    if ($Tienda -gt 0) {
        $destino = $tiendas | Where-Object { $_[0] -eq [string]$Tienda } | Select-Object -First 1
        if (-not $destino) { Imprimir-Tabla -Encabezado @("tienda", "tenant", "empresa", "nombre") -Filas $tiendas; Terminar 1 "No existe la tienda $Tienda; no se cambio nada." }
    } elseif ($tiendas.Count -eq 1) {
        $destino = $tiendas[0]
    } else {
        Imprimir-Tabla -Encabezado @("tienda", "tenant", "empresa", "nombre") -Filas $tiendas
        Terminar 1 "Hay $($tiendas.Count) tiendas: indica a cual pasan los registros con -Tienda <numero>. No se cambio nada."
    }
    $idTienda = $destino[0]; $idTenant = $destino[1]; $idEmpresa = $destino[2]
    Ok "Tienda real: $idTienda ($($destino[3])), tenant $idTenant, empresa $idEmpresa"
    # Solo se mueve lo que esta en una tienda que NO existe (o sin tienda), o en la
    # tienda destino con otro tenant/empresa. Lo de otra tienda real nunca se toca.
    $huerfano = "(tienda_id IS NULL OR tienda_id = $idTienda OR tienda_id NOT IN (SELECT id FROM tiendas))"

    Titulo "[2/4] Que esta fuera de la tienda real"
    $lista = if ($Tablas) { @($Tablas -split '[,; ]+' | Where-Object { $_ -ne "" }) } else { $TABLAS_UNIFICAR }
    $plan = @(); $filas = @()
    foreach ($t in $lista) {
        $ct = Columnas $BaseActual $t
        if ($ct.Count -eq 0) { continue }
        if ($ct -notcontains "id" -or $ct -notcontains "tienda_id") { Aviso "$t no tiene id/tienda_id; se omite"; continue }
        $scope = @(@("tenant_id", $idTenant), @("empresa_id", $idEmpresa), @("tienda_id", $idTienda) | Where-Object { $ct -contains $_[0] })
        $cond = "NOT (" + (($scope | ForEach-Object { "$(Ident $_[0]) <=> $($_[1])" }) -join " AND ") + ") AND $huerfano"
        $grupos = A-Filas (Consultar ("SELECT " + (($scope | ForEach-Object { "IFNULL($(Ident $_[0]),'NULL')" }) -join ", ") + ", COUNT(*), DATE_FORMAT(MIN(created_at),'%Y-%m-%d'), DATE_FORMAT(MAX(created_at),'%Y-%m-%d') " +
            "FROM $(Ident $t) WHERE $cond GROUP BY " + (($scope | ForEach-Object { Ident $_[0] }) -join ", ") + ";") $BaseActual)
        $n = 0
        foreach ($g in $grupos) {
            $desde = ($g[0..($scope.Count - 1)]) -join "/"
            $cnt = $g[$scope.Count]
            $n += [int64]$cnt
            $filas += ,@($t, $desde, "$idTenant/$idEmpresa/$idTienda", $cnt, $g[$scope.Count + 1], $g[$scope.Count + 2])
        }
        if ($n -gt 0) { $plan += [pscustomobject]@{ Tabla = $t; Scope = $scope; Cond = $cond; N = $n } }
    }
    Imprimir-Tabla -Encabezado @("tabla", "esta en (ten/emp/tda)", "pasa a", "registros", "desde", "hasta") -Filas $filas

    # Usuarios: solo los que se pidan por numero, nunca el superadmin.
    $usuariosPlan = @()
    $cand = A-Filas (Consultar "SELECT u.id, u.email, u.nombre, u.rol, IFNULL(u.tenant_id,'NULL'), IFNULL(u.empresa_id,'NULL'), IFNULL(u.tienda_id,'NULL'), u.activo FROM users u WHERE u.rol <> 'superadmin' AND NOT (u.tenant_id <=> $idTenant AND u.empresa_id <=> $idEmpresa AND u.tienda_id <=> $idTienda) AND (u.tienda_id IS NULL OR u.tienda_id = $idTienda OR u.tienda_id NOT IN (SELECT id FROM tiendas)) ORDER BY u.id;" $BaseActual)
    if ($cand.Count -gt 0) {
        Escribir ""
        Escribir "      Usuarios fuera de la tienda real (no salen en su login):"
        Imprimir-Tabla -Encabezado @("id", "email", "nombre", "rol", "ten", "emp", "tda", "act") -Filas $cand
        if (-not $Usuarios) {
            $sugeridos = @($cand | Where-Object { $_[1] -notmatch '@iados\.mx$' } | ForEach-Object { $_[0] })
            if ($sugeridos.Count -gt 0) { Escribir "      No se mueven solos. Si son de esta tienda, pidelos por numero: -Usuarios $($sugeridos -join ',')" "Cyan" }
            Escribir "      (los @iados.mx son de demostracion de la instalacion: dejalos fuera)"
        }
    }
    if ($Usuarios) {
        foreach ($id in @($Usuarios -split '[,; ]+' | Where-Object { $_ -match '^\d+$' })) {
            $u = $cand | Where-Object { $_[0] -eq $id } | Select-Object -First 1
            if ($u) { $usuariosPlan += $id } else { Aviso "El usuario $id no se mueve (no existe, es superadmin, ya esta en la tienda real o es de otra tienda real)" }
        }
        if ($usuariosPlan.Count -gt 0) { Escribir "      Usuarios que pasan a la tienda ${idTienda}: $($usuariosPlan -join ', ')" }
    }

    $abiertas = A-Filas (Consultar "SELECT id, nombre, IFNULL(tienda_id,'NULL') FROM cajas WHERE estado='abierta' AND NOT (tenant_id <=> $idTenant AND empresa_id <=> $idEmpresa AND tienda_id <=> $idTienda) AND $huerfano;" $BaseActual)
    foreach ($c in $abiertas) { Aviso "La caja $($c[0]) '$($c[1])' sigue ABIERTA en la tienda $($c[2]); al moverla, la tienda $idTienda tendria otra caja abierta. Cerrarla despues desde Caja." }

    if ($plan.Count -eq 0 -and $usuariosPlan.Count -eq 0) { Terminar 0 "Todo ya esta en la tienda real. No se cambio nada." }
    if (-not $Confirmar) {
        Escribir ""
        Escribir "      Para aplicarlo:" "Cyan"
        Escribir "      powershell -NoProfile -ExecutionPolicy Bypass -File $($MyInvocation.ScriptName) -Paso Unificar -Confirmar$(Opciones-Repetidas)" "Cyan"
        Terminar 2 "SIMULACION: no se cambio nada."
    }

    Titulo "[3/4] Respaldo y archivo para deshacer"
    $previo = Tomar-Respaldo -Etiqueta "preunificar"
    $carpeta = Join-Path $InstallDir "logs\reparacion-$sello"
    New-Item -ItemType Directory -Path $carpeta -Force | Out-Null
    $deshacer = New-Object System.Text.StringBuilder
    [void]$deshacer.AppendLine("-- Regresa cada registro que movio REPARAR-MARISCOS -Paso Unificar el $sello a la tienda donde estaba.")
    $esperadas = 0
    foreach ($p in $plan) {
        $set = ($p.Scope | ForEach-Object { "'$($_[0])=', IFNULL($(Ident $_[0]),'NULL')" }) -join ", ', ', "
        $lineas = Consultar "SELECT CONCAT('UPDATE $(Ident $p.Tabla) SET ', $set, ' WHERE id=', id, ';') FROM $(Ident $p.Tabla) WHERE $($p.Cond);" $BaseActual
        foreach ($l in $lineas) { if ($l) { [void]$deshacer.AppendLine($l); $esperadas++ } }
    }
    if ($usuariosPlan.Count -gt 0) {
        $lineas = Consultar "SELECT CONCAT('UPDATE users SET tenant_id=', IFNULL(tenant_id,'NULL'), ', empresa_id=', IFNULL(empresa_id,'NULL'), ', tienda_id=', IFNULL(tienda_id,'NULL'), ' WHERE id=', id, ';') FROM users WHERE id IN ($($usuariosPlan -join ','));" $BaseActual
        foreach ($l in $lineas) { if ($l) { [void]$deshacer.AppendLine($l); $esperadas++ } }
    }
    $rutaDeshacer = Join-Path $carpeta "deshacer-unificar.sql"
    Set-TextoSinBOM -Ruta $rutaDeshacer -Texto $deshacer.ToString()
    $deberian = ($plan | Measure-Object -Property N -Sum).Sum + $usuariosPlan.Count
    if ($esperadas -ne $deberian) { Terminar 1 "El archivo para deshacer salio con $esperadas lineas y debian ser $deberian. No se cambio nada." }
    Ok "Archivo para deshacer: $rutaDeshacer ($esperadas registros)"

    Titulo "[4/4] Moviendo a la tienda $idTienda (todo o nada)"
    $sql = New-Object System.Text.StringBuilder
    [void]$sql.AppendLine("START TRANSACTION;")
    foreach ($p in $plan) {
        $set = ($p.Scope | ForEach-Object { "$(Ident $_[0])=$($_[1])" }) -join ", "
        [void]$sql.AppendLine("UPDATE $(Ident $p.Tabla) SET $set WHERE $($p.Cond);")
        [void]$sql.AppendLine("SELECT '$($p.Tabla)', ROW_COUNT();")
    }
    if ($usuariosPlan.Count -gt 0) {
        [void]$sql.AppendLine("UPDATE users SET tenant_id=$idTenant, empresa_id=$idEmpresa, tienda_id=$idTienda WHERE rol <> 'superadmin' AND id IN ($($usuariosPlan -join ','));")
        [void]$sql.AppendLine("SELECT 'users', ROW_COUNT();")
    }
    [void]$sql.AppendLine("COMMIT;")
    $hecho = A-Filas (Consultar $sql.ToString() $BaseActual)
    Imprimir-Tabla -Encabezado @("tabla", "movidos") -Filas $hecho
    Escribir ""
    Escribir "      Para deshacerlo:" "Cyan"
    Escribir "      powershell -NoProfile -ExecutionPolicy Bypass -File $REVERTIR -Respaldo `"$previo`" -SoloBaseDeDatos" "Cyan"
    Escribir "      (o solo regresar lo movido con $rutaDeshacer)"
    Escribir "      Las ventas movidas conservan su folio; puede haber folios repetidos con las de la tienda $idTienda."
    Terminar 0 "Unificacion aplicada. Respaldo previo: $previo"
}

switch ($Paso) {
    "Revisar"  { Paso-Revisar }
    "Comparar" { Paso-Comparar }
    "Importar" { Paso-Importar }
    "Unificar" { Paso-Unificar }
}
