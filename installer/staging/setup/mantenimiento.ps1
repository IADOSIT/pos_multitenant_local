# =============================================================================
#  POS-iaDoS - MANTENIMIENTO
#
#  Un solo lugar para todo lo que se hace sobre una instalacion ya operando:
#  respaldar, revertir, exportar a Excel, revisar imagenes, ver ajustes y
#  diagnosticar.
#
#  Dos formas de usarlo:
#
#    Menu (alguien frente al equipo):
#      .\mantenimiento.ps1
#
#    Desatendido (conexion remota, sin ver la pantalla):
#      .\mantenimiento.ps1 -Accion diagnostico
#      .\mantenimiento.ps1 -Accion respaldar
#      .\mantenimiento.ps1 -Accion excel
#      .\mantenimiento.ps1 -Accion imagenes          (solo reporta)
#      .\mantenimiento.ps1 -Accion arreglar-imagenes (reporta y corrige URL)
#      .\mantenimiento.ps1 -Accion ajustes
#      .\mantenimiento.ps1 -Accion respaldos         (lista lo que hay)
#      .\mantenimiento.ps1 -Accion ensayar -Paquete "C:\temp\paquete-nuevo"
#                                                    (prueba una actualizacion
#                                                     sin detener el sistema)
#
#  Nada de lo que hay aqui borra datos del cliente. La unica accion que
#  sobrescribe es revertir, y esa pide confirmacion escrita.
# =============================================================================
param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [ValidateSet("", "menu", "diagnostico", "respaldar", "revertir", "excel",
                 "imagenes", "arreglar-imagenes", "ajustes", "respaldos",
                 "ensayar")]
    [string]$Accion = "",
    [string]$Respaldo = "",
    [string]$Paquete = "",
    [switch]$SiSinPreguntar
)

$ErrorActionPreference = "Stop"

function Escribir { param([string]$t = "", [string]$c = "Gray") Write-Host $t -ForegroundColor $c }
function Titulo   { param([string]$t) Escribir ""; Escribir "  $t" "Cyan" }
function Ok       { param([string]$t) Escribir "    OK  $t" "Green" }
function Aviso    { param([string]$t) Escribir "    !   $t" "Yellow" }
function Falla    { param([string]$t) Escribir "    X   $t" "Red" }

function Leer-Env {
    param([string]$Ruta)
    $h = @{}
    if (-not (Test-Path $Ruta)) { return $h }
    foreach ($linea in (Get-Content -Path $Ruta -Encoding UTF8)) {
        $t = $linea.Trim()
        if ($t -eq "" -or $t.StartsWith("#")) { continue }
        $i = $t.IndexOf("=")
        if ($i -lt 1) { continue }
        $h[$t.Substring(0, $i).Trim()] = $t.Substring($i + 1).Trim()
    }
    return $h
}

function Tamano-Legible {
    param([double]$Bytes)
    if ($Bytes -ge 1073741824) { return "{0:N2} GB" -f ($Bytes / 1073741824) }
    if ($Bytes -ge 1048576)    { return "{0:N1} MB" -f ($Bytes / 1048576) }
    if ($Bytes -ge 1024)       { return "{0:N0} KB" -f ($Bytes / 1024) }
    return "$Bytes bytes"
}

function Puerto-Abierto {
    param([int]$Puerto)
    try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect("127.0.0.1", $Puerto); $c.Close(); return $true }
    catch { return $false }
}

$NODE        = Join-Path $InstallDir "node\node.exe"
$NODE_TOOLS  = Join-Path $InstallDir "tools\node"
$TOOLS       = Join-Path $InstallDir "tools"
$ENV_BACKEND = Join-Path $InstallDir "backend\.env"
$VERSION_JS  = Join-Path $InstallDir "version.json"
$BACKUPS     = Join-Path $InstallDir "backups"
$SVC_BACKEND = "PosIaDos-Backend"
$SVC_DB      = "PosIaDos-MariaDB"

if (-not (Test-Path $InstallDir)) {
    Escribir ""
    Escribir "  No existe $InstallDir." "Red"
    Escribir "  Usa -InstallDir para indicar donde esta instalado." "Yellow"
    Escribir ""
    exit 1
}

# =============================================================================
#  Diagnostico: lo primero que hay que pedirle al cliente cuando reporta algo
# =============================================================================
function Diagnostico {
    Escribir ""
    Escribir "  ==========================================================" "Cyan"
    Escribir "   DIAGNOSTICO - $(Get-Date -Format 'dd/MM/yyyy HH:mm')" "Cyan"
    Escribir "  ==========================================================" "Cyan"

    $cfg = Leer-Env -Ruta $ENV_BACKEND
    $puerto = if ($cfg.PORT) { [int]$cfg.PORT } else { 3000 }
    $problemas = 0

    Titulo "Version"
    $vLocal = "desconocida"
    if (Test-Path $VERSION_JS) {
        try {
            $vj = Get-Content $VERSION_JS -Raw | ConvertFrom-Json
            $vLocal = $vj.version
            Ok "Archivos instalados: $vLocal   (fecha: $($vj.build_date))"
            if ($vj.version_previa) { Escribir "        venia de: $($vj.version_previa)" "DarkGray" }
        } catch { Aviso "version.json no se pudo leer" }
    } else { Aviso "No hay version.json" }

    Titulo "Servicios de Windows"
    foreach ($s in @($SVC_DB, $SVC_BACKEND)) {
        $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
        if (-not $svc) { Falla "$s NO esta registrado"; $problemas++ }
        elseif ($svc.Status -eq "Running") { Ok "$s corriendo" }
        else { Falla "$s esta $($svc.Status)"; $problemas++ }
    }

    Titulo "El sistema responde"
    if (Puerto-Abierto -Puerto $puerto) {
        Ok "Puerto $puerto abierto"
        $vReportada = $null
        foreach ($u in @("http://127.0.0.1:$puerto/api/deploy/version", "http://127.0.0.1:$puerto/deploy/version")) {
            try { $r = Invoke-RestMethod -Uri $u -TimeoutSec 10; if ($r.version) { $vReportada = $r.version; break } } catch {}
        }
        if ($vReportada) {
            if ($vReportada -eq $vLocal) { Ok "El sistema corriendo reporta la version $vReportada (coincide)" }
            else { Falla "Los archivos dicen $vLocal pero el sistema corriendo reporta $vReportada. Hay que reiniciar el servicio."; $problemas++ }
        } else { Aviso "El sistema no reporto su version" }

        try {
            $h = Invoke-RestMethod -Uri "http://127.0.0.1:$puerto/api/health" -TimeoutSec 10
            Ok "Salud: $(($h | ConvertTo-Json -Compress -Depth 3))"
        } catch { Aviso "No contesto /api/health" }
    } else {
        Falla "El puerto $puerto NO responde: el sistema no esta operando"
        $problemas++
        foreach ($lg in @("logs\backend-error.log", "logs\backend.log")) {
            $p = Join-Path $InstallDir $lg
            if (Test-Path $p) {
                Escribir ""
                Escribir "   Ultimas lineas de $lg" "Yellow"
                foreach ($l in (Get-Content $p -Tail 15 -ErrorAction SilentlyContinue)) { Escribir "     $l" "DarkGray" }
            }
        }
    }

    Titulo "Base de datos"
    if ((Test-Path $NODE) -and (Test-Path (Join-Path $NODE_TOOLS "ajustes.js"))) {
        # Se usa el mismo codigo que los respaldos para conectarse, asi que si
        # esto funciona, los respaldos tambien van a funcionar.
        $tmp = Join-Path $env:TEMP ("pos-diag-" + [guid]::NewGuid().ToString("N").Substring(0,8))
        New-Item -ItemType Directory -Path $tmp -Force | Out-Null
        try {
            & $NODE (Join-Path $NODE_TOOLS "ajustes.js") --install-dir $InstallDir --salida $tmp 2>&1 |
                Select-Object -Last 6 | ForEach-Object { Escribir "      $_" "DarkGray" }
            $aj = Join-Path $tmp "ajustes.json"
            if (Test-Path $aj) {
                $j = Get-Content $aj -Raw | ConvertFrom-Json
                Ok "Conexion a la base correcta. Tablas: $($j.tablas_totales)"
            } else { Falla "No se pudo leer la base de datos"; $problemas++ }
        } catch { Falla "No se pudo leer la base de datos: $($_.Exception.Message)"; $problemas++ }
        finally { Remove-Item -Path $tmp -Recurse -Force -ErrorAction SilentlyContinue }
    } else { Aviso "No estan las herramientas en tools\node; no se puede revisar la base" }

    $datos = Join-Path $InstallDir "mariadb\data"
    if (Test-Path $datos) {
        $t = (Get-ChildItem -Path $datos -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        Ok "Datos en disco: $(Tamano-Legible $t)"
    } else { Falla "No existe mariadb\data"; $problemas++ }

    Titulo "Imagenes"
    $up = Join-Path $InstallDir "backend\uploads"
    if (Test-Path $up) {
        $arch = Get-ChildItem -Path $up -Recurse -File -ErrorAction SilentlyContinue
        $t = ($arch | Measure-Object -Property Length -Sum).Sum
        Ok "$($arch.Count) archivos, $(Tamano-Legible $t)"
    } else { Aviso "Todavia no hay carpeta de imagenes subidas" }

    Titulo "Respaldos"
    if (Test-Path $BACKUPS) {
        $carp = Get-ChildItem -Path $BACKUPS -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
        if ($carp.Count -eq 0) { Falla "NO hay ningun respaldo. Haz uno antes de cualquier cambio."; $problemas++ }
        else {
            Ok "$($carp.Count) respaldo(s). El mas reciente: $($carp[0].Name) ($($carp[0].LastWriteTime.ToString('dd/MM/yyyy HH:mm')))"
            $dias = ((Get-Date) - $carp[0].LastWriteTime).TotalDays
            if ($dias -gt 7) { Aviso "El ultimo respaldo tiene $([int]$dias) dias" }
        }
    } else { Falla "No existe la carpeta de respaldos"; $problemas++ }

    Titulo "Espacio en disco"
    $unidad = (Get-Item $InstallDir).PSDrive.Name
    $d = Get-PSDrive -Name $unidad
    $libre = $d.Free
    Escribir "        Unidad ${unidad}: libre $(Tamano-Legible $libre)"
    if ($libre -lt 2147483648) { Falla "Queda menos de 2 GB. Un respaldo puede no caber."; $problemas++ }
    else { Ok "Espacio suficiente" }

    Titulo "Licencia"
    if (Puerto-Abierto -Puerto $puerto) {
        try {
            $l = Invoke-RestMethod -Uri "http://127.0.0.1:$puerto/api/licencias/estado-publico" -TimeoutSec 10
            Escribir "        $(($l | ConvertTo-Json -Compress -Depth 3))" "DarkGray"
        } catch { Escribir "        (no consultable sin sesion; normal)" "DarkGray" }
    }

    $ultAct = Join-Path $InstallDir "ULTIMA-ACTUALIZACION.txt"
    if (Test-Path $ultAct) {
        Titulo "Ultima actualizacion"
        foreach ($l in (Get-Content $ultAct -TotalCount 14 -ErrorAction SilentlyContinue)) { Escribir "        $l" "DarkGray" }
    }

    Escribir ""
    Escribir "  ==========================================================" $(if ($problemas -eq 0) { "Green" } else { "Yellow" })
    if ($problemas -eq 0) { Escribir "   TODO EN ORDEN" "Green" }
    else { Escribir "   $problemas PUNTO(S) A REVISAR (ver las lineas con X arriba)" "Yellow" }
    Escribir "  ==========================================================" $(if ($problemas -eq 0) { "Green" } else { "Yellow" })
    Escribir ""

    # Se guarda para poder pedirselo al cliente por correo.
    return $problemas
}

function Listar-Respaldos {
    Titulo "Respaldos disponibles"
    if (-not (Test-Path $BACKUPS)) { Falla "No existe $BACKUPS"; return }
    $carp = Get-ChildItem -Path $BACKUPS -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if ($carp.Count -eq 0) { Falla "No hay respaldos"; return }
    $i = 1
    foreach ($c in $carp) {
        $m = Join-Path $c.FullName "manifest.json"
        $detalle = ""
        if (Test-Path $m) {
            try {
                $j = Get-Content $m -Raw | ConvertFrom-Json
                $detalle = "version $($j.version)  |  $($j.base_sql.tablas) tablas  |  $($j.uploads.archivos) imagenes"
            } catch { $detalle = "manifest ilegible" }
        } else { $detalle = "SIN manifest (respaldo incompleto)" }
        $t = (Get-ChildItem -Path $c.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        Escribir ""
        Escribir "   [$i] $($c.Name)" "White"
        Escribir "       $($c.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))  -  $(Tamano-Legible $t)"
        Escribir "       $detalle" "DarkGray"
        $i++
    }
    Escribir ""
    Escribir "   Para regresar a uno:" "Cyan"
    Escribir "     .\revertir.ps1 -Respaldo ""$BACKUPS\<nombre de la carpeta>""" "Cyan"
    Escribir ""
}

function Correr-Script {
    param([string]$Nombre, [string[]]$Argumentos)
    $p = Join-Path $TOOLS $Nombre
    if (-not (Test-Path $p)) {
        # Tambien se busca junto a este archivo, para poder probarlo antes de
        # empaquetar.
        $p = Join-Path $PSScriptRoot $Nombre
    }
    if (-not (Test-Path $p)) { Falla "No se encontro $Nombre"; return 1 }
    $base = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $p, "-InstallDir", $InstallDir)
    & powershell @($base + $Argumentos)
    return $LASTEXITCODE
}

function Correr-Node {
    param([string]$Script, [string[]]$Argumentos, [string]$Salida)
    if (-not (Test-Path $NODE)) { Falla "No se encontro node.exe en $NODE"; return 1 }
    $js = Join-Path $NODE_TOOLS $Script
    if (-not (Test-Path $js)) { $js = Join-Path (Join-Path $PSScriptRoot "node") $Script }
    if (-not (Test-Path $js)) { Falla "No se encontro $Script"; return 1 }
    New-Item -ItemType Directory -Path $Salida -Force | Out-Null
    & $NODE $js --install-dir $InstallDir --salida $Salida @Argumentos
    return $LASTEXITCODE
}

function Carpeta-Reporte {
    param([string]$Que)
    $c = Join-Path $BACKUPS ("reportes-" + $Que + "-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
    New-Item -ItemType Directory -Path $c -Force | Out-Null
    return $c
}

# =============================================================================
#  Acciones directas (modo desatendido)
# =============================================================================
switch ($Accion) {
    "diagnostico" { $n = Diagnostico; exit $(if ($n -eq 0) { 0 } else { 2 }) }
    "respaldos"   { Listar-Respaldos; exit 0 }
    "respaldar"   { exit (Correr-Script -Nombre "respaldar.ps1" -Argumentos @("-Etiqueta", "manual")) }
    "revertir"    {
        if ($Respaldo -eq "") { Listar-Respaldos; Falla "Falta -Respaldo con la carpeta"; exit 1 }
        $a = @("-Respaldo", $Respaldo)
        if ($SiSinPreguntar) { $a += "-SiSinPreguntar" }
        exit (Correr-Script -Nombre "revertir.ps1" -Argumentos $a)
    }
    "ensayar" {
        if ($Paquete -eq "") { Falla "Falta -Paquete con la carpeta del paquete nuevo"; exit 1 }
        $a = @("-Paquete", $Paquete)
        if ($Respaldo -ne "") { $a += @("-Respaldo", $Respaldo) }
        exit (Correr-Script -Nombre "ensayar.ps1" -Argumentos $a)
    }
    "excel" {
        $c = Carpeta-Reporte -Que "excel"
        $r = Correr-Node -Script "exportar-excel.js" -Argumentos @() -Salida $c
        if ($r -eq 0) { Escribir ""; Ok "Excel en: $c"; Escribir "" }
        exit $r
    }
    "imagenes" {
        $c = Carpeta-Reporte -Que "imagenes"
        $r = Correr-Node -Script "imagenes.js" -Argumentos @() -Salida $c
        if ($r -eq 0) { Escribir ""; Ok "Reporte en: $c\IMAGENES.txt"; Escribir "" }
        exit $r
    }
    "arreglar-imagenes" {
        $c = Carpeta-Reporte -Que "imagenes"
        $r = Correr-Node -Script "imagenes.js" -Argumentos @("--arreglar") -Salida $c
        if ($r -eq 0) {
            Escribir ""
            Ok "Reporte en: $c\IMAGENES.txt"
            Escribir "   Los valores anteriores quedaron en $c\urls-antes.json" "Cyan"
            Escribir "   Ninguna URL se borro." "Green"
            Escribir ""
        }
        exit $r
    }
    "ajustes" {
        $c = Carpeta-Reporte -Que "ajustes"
        $r = Correr-Node -Script "ajustes.js" -Argumentos @() -Salida $c
        if ($r -eq 0) { Escribir ""; Ok "Reporte en: $c\AJUSTES.txt"; Escribir "" }
        exit $r
    }
}

# =============================================================================
#  Menu
# =============================================================================
while ($true) {
    Escribir ""
    Escribir "  ==========================================================" "Cyan"
    Escribir "   POS-iaDoS - MANTENIMIENTO" "Cyan"
    Escribir "  ==========================================================" "Cyan"
    $v = "?"
    if (Test-Path $VERSION_JS) { try { $v = (Get-Content $VERSION_JS -Raw | ConvertFrom-Json).version } catch {} }
    $svc = Get-Service -Name $SVC_BACKEND -ErrorAction SilentlyContinue
    $estado = if ($svc -and $svc.Status -eq "Running") { "operando" } else { "DETENIDO" }
    Escribir "   Version $v   -   sistema $estado" $(if ($estado -eq "operando") { "Green" } else { "Red" })
    Escribir ""
    Escribir "   1.  Diagnostico (que revisar primero si algo falla)"
    Escribir "   2.  Respaldar TODO ahora  (base + imagenes + Excel + ajustes)"
    Escribir "   3.  Ver los respaldos que hay"
    Escribir "   4.  REGRESAR a un respaldo anterior"
    Escribir "   5.  Exportar la base a Excel"
    Escribir "   6.  Revisar las imagenes (solo reporta, no cambia nada)"
    Escribir "   7.  Arreglar las URL de las imagenes"
    Escribir "   8.  Ver los ajustes activos del cliente"
    Escribir "   9.  Reiniciar el sistema"
    Escribir "  10.  ENSAYAR una actualizacion (sin detener el sistema)"
    Escribir "   0.  Salir"
    Escribir ""
    $op = Read-Host "   Opcion"

    switch ($op) {
        "1" { Diagnostico | Out-Null }
        "2" { Correr-Script -Nombre "respaldar.ps1" -Argumentos @("-Etiqueta", "manual") | Out-Null }
        "3" { Listar-Respaldos }
        "4" {
            Listar-Respaldos
            $nombre = Read-Host "   Nombre exacto de la carpeta del respaldo (Enter para cancelar)"
            if ($nombre -ne "") {
                $ruta = if (Test-Path $nombre) { $nombre } else { Join-Path $BACKUPS $nombre }
                if (-not (Test-Path $ruta)) { Falla "No existe: $ruta" }
                else { Correr-Script -Nombre "revertir.ps1" -Argumentos @("-Respaldo", $ruta) | Out-Null }
            }
        }
        "5" {
            $c = Carpeta-Reporte -Que "excel"
            if ((Correr-Node -Script "exportar-excel.js" -Argumentos @() -Salida $c) -eq 0) { Ok "Excel en: $c" }
        }
        "6" {
            $c = Carpeta-Reporte -Que "imagenes"
            if ((Correr-Node -Script "imagenes.js" -Argumentos @() -Salida $c) -eq 0) { Ok "Reporte en: $c\IMAGENES.txt" }
        }
        "7" {
            Escribir ""
            Escribir "   Esto ajusta las URL de las imagenes a la redireccion nueva." "White"
            Escribir "   Ninguna URL se borra: lo que no se pueda arreglar se deja" "Green"
            Escribir "   igual y sale listado en el reporte." "Green"
            Escribir ""
            if ((Read-Host "   Escribe SI para continuar") -eq "SI") {
                $c = Carpeta-Reporte -Que "imagenes"
                if ((Correr-Node -Script "imagenes.js" -Argumentos @("--arreglar") -Salida $c) -eq 0) {
                    Ok "Reporte en: $c\IMAGENES.txt"
                    Escribir "   Valores anteriores: $c\urls-antes.json" "Cyan"
                }
            } else { Escribir "   Cancelado." "Yellow" }
        }
        "8" {
            $c = Carpeta-Reporte -Que "ajustes"
            if ((Correr-Node -Script "ajustes.js" -Argumentos @() -Salida $c) -eq 0) {
                Ok "Reporte en: $c\AJUSTES.txt"
                $txt = Join-Path $c "AJUSTES.txt"
                if (Test-Path $txt) { Escribir ""; Get-Content $txt -TotalCount 45 | ForEach-Object { Escribir "   $_" "DarkGray" } }
            }
        }
        "9" {
            $nssm = Join-Path $TOOLS "nssm.exe"
            if (Test-Path $nssm) { & $nssm restart $SVC_BACKEND 2>&1 | Out-Null }
            else { Restart-Service -Name $SVC_BACKEND -Force -ErrorAction SilentlyContinue }
            Escribir "        Esperando..."
            $cfg = Leer-Env -Ruta $ENV_BACKEND
            $puerto = if ($cfg.PORT) { [int]$cfg.PORT } else { 3000 }
            $fin = (Get-Date).AddSeconds(150)
            $arranco = $false
            while ((Get-Date) -lt $fin) { if (Puerto-Abierto -Puerto $puerto) { $arranco = $true; break }; Start-Sleep -Seconds 2 }
            if ($arranco) { Ok "El sistema volvio a arrancar en el puerto $puerto" }
            else { Falla "No arranco. Corre la opcion 1 (diagnostico)." }
        }
        "10" {
            Escribir ""
            Escribir "   Esto prueba la version nueva contra una COPIA de tu base." "White"
            Escribir "   El sistema NO se detiene y la base real solo se lee." "Green"
            Escribir "   Al final dice si se puede actualizar o no." "Green"
            Escribir ""
            $paq = Read-Host "   Carpeta del paquete nuevo (Enter para cancelar)"
            if ($paq -ne "") {
                if (-not (Test-Path $paq)) { Falla "No existe: $paq" }
                else { Correr-Script -Nombre "ensayar.ps1" -Argumentos @("-Paquete", $paq) | Out-Null }
            } else { Escribir "   Cancelado." "Yellow" }
        }
        "0" { Escribir ""; exit 0 }
        default { Aviso "Opcion no valida" }
    }

    Escribir ""
    Read-Host "   Enter para volver al menu" | Out-Null
}
