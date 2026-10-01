@echo off
title POS-iaDoS - Revisar el equipo
setlocal
chcp 437 1>nul 2>nul

echo.
echo   ==============================================================
echo     POS-iaDoS - Revision del equipo
echo   ==============================================================
echo.
echo   Esta revision SOLO LEE. No instala, no detiene el sistema,
echo   no toca la base de datos y no borra nada.
echo.
echo   Al terminar deja un archivo REVISION-EQUIPO.txt. Hay que
echo   mandar ese archivo completo.
echo.

set "POSPS=%TEMP%\pos-revisar-equipo.ps1"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText([Environment]::GetCommandLineArgs()[0]); exit 0" 1>nul 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$t=[IO.File]::ReadAllText('%~f0'); $m='#PSB'+'EGIN#'; $i=$t.IndexOf($m); if($i -lt 0){ exit 9 }; [IO.File]::WriteAllText($env:POSPS, $t.Substring($i+$m.Length), (New-Object System.Text.UTF8Encoding $false))"

if errorlevel 1 (
  echo   No se pudo preparar la revision. Revisa que PowerShell funcione.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%POSPS%" %*
set "POSCODE=%ERRORLEVEL%"

del "%POSPS%" 1>nul 2>nul

echo.
if "%POSCODE%"=="0" echo   Resultado: sin pendientes.
if "%POSCODE%"=="2" echo   Resultado: revisado, con pendientes anotados arriba.
if "%POSCODE%"=="1" echo   Resultado: no se pudo completar la revision.
echo.
pause
exit /b %POSCODE%

#PSBEGIN#
# =============================================================================
# POS-iaDoS - Revisar el equipo (solo lee, no cambia NADA)
#
# Para que sirve: antes de instalar o actualizar, dice exactamente que hay en
# este equipo. No detiene servicios, no escribe en la base, no toca archivos
# del sistema. Lo unico que crea es el reporte.
#
# No necesita permisos de administrador ni internet.
#
# Uso:
#   .\revisar-equipo.ps1
#   .\revisar-equipo.ps1 -InstallDir "D:\POS-iaDoS"
#
# Deja el reporte en:  <InstallDir>\REVISION-EQUIPO.txt
#                      (y si no puede escribir ahi, en el Escritorio)
#
# Codigos de salida:
#   0  revisado; se puede actualizar
#   2  revisado, pero hay algo que hay que resolver antes
#   1  no se pudo revisar
# =============================================================================
param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [string]$Reporte    = ""
)

$ErrorActionPreference = "Continue"

$lineas = New-Object System.Collections.ArrayList
$avisos = New-Object System.Collections.ArrayList

function L {
    param([string]$t = "", [string]$c = "Gray")
    [void]$lineas.Add($t)
    Write-Host $t -ForegroundColor $c
}
function Titulo {
    param([string]$t)
    L ""
    L ("-" * 74)
    L "  $t"
    L ("-" * 74)
}
function Pendiente {
    param([string]$t)
    [void]$avisos.Add($t)
}
function Tam {
    param([long]$Bytes)
    if ($Bytes -ge 1073741824) { return ("{0:N2} GB" -f ($Bytes / 1073741824)) }
    if ($Bytes -ge 1048576)    { return ("{0:N1} MB" -f ($Bytes / 1048576)) }
    if ($Bytes -ge 1024)       { return ("{0:N0} KB" -f ($Bytes / 1024)) }
    return "$Bytes bytes"
}
function Puerto-Abierto {
    param([int]$Puerto)
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $c.Connect("127.0.0.1", $Puerto)
        $c.Close()
        return $true
    } catch { return $false }
}
function Quien-Escucha {
    param([int]$Puerto)
    try {
        $con = Get-NetTCPConnection -LocalPort $Puerto -State Listen -ErrorAction Stop | Select-Object -First 1
        $pr  = Get-Process -Id $con.OwningProcess -ErrorAction Stop
        return "$($pr.ProcessName) (PID $($pr.Id))"
    } catch { return "no se pudo identificar" }
}
function Leer-Env {
    param([string]$Ruta)
    $h = @{}
    if (-not (Test-Path $Ruta)) { return $h }
    foreach ($linea in (Get-Content -Path $Ruta -Encoding UTF8 -ErrorAction SilentlyContinue)) {
        $t = $linea.Trim()
        if ($t -eq "" -or $t.StartsWith("#")) { continue }
        $i = $t.IndexOf("=")
        if ($i -lt 1) { continue }
        $h[$t.Substring(0, $i).Trim()] = $t.Substring($i + 1).Trim()
    }
    return $h
}

L ""
L "==========================================================================" "Cyan"
L "  POS-iaDoS - Revision del equipo" "Cyan"
L "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Cyan"
L "  Esta revision SOLO LEE. No cambia nada en el equipo." "Green"
L "==========================================================================" "Cyan"

# =============================================================================
# 1. El equipo
# =============================================================================
Titulo "1. El equipo"

try {
    $so = Get-CimInstance Win32_OperatingSystem
    L "  Windows            : $($so.Caption) (build $($so.BuildNumber))"
    L "  Arquitectura       : $(if ([System.Environment]::Is64BitOperatingSystem) { '64 bits' } else { '32 BITS' })"
    L "  Memoria total      : $([math]::Round($so.TotalVisibleMemorySize / 1MB, 1)) GB"
    L "  Memoria libre      : $([math]::Round($so.FreePhysicalMemory / 1MB, 1)) GB"
    if (-not [System.Environment]::Is64BitOperatingSystem) {
        Pendiente "Este Windows es de 32 bits. POS-iaDoS on-premise necesita 64 bits."
    }
} catch {
    L "  No se pudo leer la informacion del sistema"
}
L "  Nombre del equipo  : $env:COMPUTERNAME"
L "  Usuario            : $env:USERNAME"
L "  PowerShell         : $($PSVersionTable.PSVersion)"

$esAdmin = $false
try {
    $esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
                ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
} catch { }
L "  Corriendo como admin: $(if ($esAdmin) { 'si' } else { 'no (para revisar no hace falta)' })"

# Universal CRT. Se busca ucrtbase.dll, que es el archivo real; los nombres
# api-ms-win-crt-*.dll son api sets virtuales y no existen en disco.
if (Test-Path "$env:SystemRoot\System32\ucrtbase.dll") {
    L "  Librerias Windows  : OK (Universal CRT presente)"
} else {
    L "  Librerias Windows  : no se encontro ucrtbase.dll"
    Pendiente "No se encontro ucrtbase.dll. Si MariaDB no arranca, instala las actualizaciones de Windows."
}

# =============================================================================
# 2. Donde esta instalado de verdad
# =============================================================================
Titulo "2. Donde esta instalado"

function Obtener-RutaInstalada {
    foreach ($svc in @("PosIaDos-Backend", "PosIaDos-MariaDB")) {
        $llave = "HKLM:\SYSTEM\CurrentControlSet\Services\$svc\Parameters"
        if (-not (Test-Path $llave)) { continue }
        $par = Get-ItemProperty -Path $llave -ErrorAction SilentlyContinue
        foreach ($valor in @($par.AppDirectory, $par.Application)) {
            if (-not $valor) { continue }
            $d = $valor
            if (Test-Path $d -PathType Leaf) { $d = Split-Path -Parent $d }
            for ($i = 0; $i -lt 4 -and $d; $i++) {
                if ((Test-Path (Join-Path $d "backend")) -or (Test-Path (Join-Path $d "mariadb"))) { return $d }
                $d = Split-Path -Parent $d
            }
        }
    }
    return ""
}

$rutaServicios = Obtener-RutaInstalada
if ($rutaServicios) {
    L "  Segun los servicios: $rutaServicios"
    if ($rutaServicios.TrimEnd("\") -ne $InstallDir.TrimEnd("\")) {
        L "  Se esperaba en     : $InstallDir"
        L "  -> Se usara la ruta real de los servicios." "Yellow"
        $InstallDir = $rutaServicios
    }
} else {
    L "  No hay servicios de POS-iaDoS registrados en este equipo."
}
L "  Carpeta revisada   : $InstallDir"
L "  Existe             : $(if (Test-Path $InstallDir) { 'si' } else { 'NO' })"

if (-not (Test-Path $InstallDir)) {
    L ""
    L "  Conclusion: en este equipo no hay POS-iaDoS instalado (o esta en otra" "Yellow"
    L "  carpeta que no se pudo detectar). Si sabes la ruta, vuelve a correr:" "Yellow"
    L "     .\revisar-equipo.ps1 -InstallDir ""D:\la\ruta""" "Yellow"
}

# =============================================================================
# 3. Version instalada
# =============================================================================
Titulo "3. Version instalada"

$versionInstalada = "desconocida"
$vjson = Join-Path $InstallDir "version.json"
if (Test-Path $vjson) {
    try {
        $vj = Get-Content $vjson -Raw | ConvertFrom-Json
        $versionInstalada = $vj.version
        L "  version.json       : v$($vj.version)  (build $($vj.build_date))"
    } catch {
        L "  version.json       : existe pero no se pudo leer"
    }
} else {
    L "  version.json       : NO existe"
    Pendiente "No hay version.json. El instalador lo detecta igual por otras senales, pero conviene saberlo."
}

$envBackend = Join-Path $InstallDir "backend\.env"
$cfg = Leer-Env -Ruta $envBackend
if ($cfg.Count -gt 0) {
    # A proposito NO se imprimen DB_PASSWORD ni JWT_SECRET.
    L "  .env APP_VERSION   : $(if ($cfg.APP_VERSION) { $cfg.APP_VERSION } else { '(sin APP_VERSION)' })"
    L "  .env APP_PORT      : $(if ($cfg.APP_PORT) { $cfg.APP_PORT } else { '(sin APP_PORT, se asume 3000)' })"
    L "  .env INSTALL_MODE  : $(if ($cfg.INSTALL_MODE) { $cfg.INSTALL_MODE } else { '(sin INSTALL_MODE)' })"
    L "  .env DB_HOST/PORT  : $($cfg.DB_HOST):$($cfg.DB_PORT)"
    L "  .env DB_DATABASE   : $($cfg.DB_DATABASE)"
    L "  .env DB_USERNAME   : $($cfg.DB_USERNAME)"
    L "  (las contrasenas del .env no se escriben en este reporte)"
} else {
    L "  backend\.env       : NO se encontro en $envBackend"
    Pendiente "Sin backend\.env no se puede saber a que base apunta el sistema."
}

$puertoApp = if ($cfg.APP_PORT) { [int]$cfg.APP_PORT } else { 3000 }
$puertoDb  = if ($cfg.DB_PORT)  { [int]$cfg.DB_PORT }  else { 3306 }

# =============================================================================
# 4. Servicios
# =============================================================================
Titulo "4. Servicios de Windows"

foreach ($svc in @("PosIaDos-MariaDB", "PosIaDos-Backend")) {
    $s = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($s) {
        L "  $svc : $($s.Status) / arranque $((Get-CimInstance Win32_Service -Filter "Name='$svc'" -ErrorAction SilentlyContinue).StartMode)"
        if ($s.Status -ne "Running") {
            Pendiente "El servicio $svc existe pero no esta corriendo ($($s.Status))."
        }
    } else {
        L "  $svc : no existe"
    }
}

# =============================================================================
# 5. Puertos
# =============================================================================
Titulo "5. Puertos"

foreach ($pr in @(@{P = $puertoApp; N = "sistema (backend)"}, @{P = $puertoDb; N = "base de datos"})) {
    if (Puerto-Abierto -Puerto $pr.P) {
        L "  $($pr.P) ($($pr.N)) : abierto, lo usa $(Quien-Escucha -Puerto $pr.P)"
    } else {
        L "  $($pr.P) ($($pr.N)) : cerrado"
        Pendiente "El puerto $($pr.P) ($($pr.N)) esta cerrado: ese servicio no esta respondiendo."
    }
}

# Si el sistema responde, se pregunta la version por su propia API
if (Puerto-Abierto -Puerto $puertoApp) {
    try {
        $h = Invoke-RestMethod -Uri "http://127.0.0.1:$puertoApp/api/health" -TimeoutSec 10
        L "  /api/health        : responde"
        if ($h.version) { L "  version segun la API: $($h.version)" }
    } catch {
        L "  /api/health        : el puerto esta abierto pero la API no contesta"
        Pendiente "El puerto $puertoApp esta abierto pero /api/health no contesta."
    }
}

# =============================================================================
# 6. La base de datos: que tanto hay adentro
# =============================================================================
Titulo "6. La base de datos (solo se cuenta, no se modifica)"

$mysqlExe = Join-Path $InstallDir "mariadb\bin\mysql.exe"
$filasTotales = 0
$hayDatos = $false

if (-not (Test-Path $mysqlExe)) {
    L "  No se encontro $mysqlExe"
    L "  No se pudo contar la base de datos."
    Pendiente "Falta el cliente mysql.exe; no se pudo revisar la base de datos."
} elseif ($cfg.Count -eq 0) {
    L "  Sin .env no se sabe como conectarse. No se conto nada."
} else {
    $argsMy = @("-u", $cfg.DB_USERNAME, "-p$($cfg.DB_PASSWORD)",
                "--host=$($cfg.DB_HOST)", "--port=$puertoDb", "-N", "-B")

    $sqlTablas = "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$($cfg.DB_DATABASE)';"
    $nTablas = & $mysqlExe @argsMy -e $sqlTablas 2>$null
    if ($LASTEXITCODE -ne 0) {
        L "  No se pudo conectar a la base de datos."
        Pendiente "No se pudo conectar a la base de datos con los datos del .env."
    } else {
        L "  Tablas en '$($cfg.DB_DATABASE)' : $("$nTablas".Trim())"

        $sqlCenso = @"
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES
WHERE TABLE_SCHEMA='$($cfg.DB_DATABASE)' ORDER BY TABLE_NAME;
"@
        L ""
        L "  Conteo exacto de lo que importa:"
        $importantes = @("tenants","empresas","tiendas","users","licencias","categorias",
                         "productos","producto_tienda","ventas","venta_detalles","venta_pagos",
                         "pedidos","pedido_detalles","cajas","movimientos_caja","mesas",
                         "ticket_configs","menu_digital_config","movimientos_inventario")
        foreach ($t in $importantes) {
            $existe = & $mysqlExe @argsMy -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$($cfg.DB_DATABASE)' AND TABLE_NAME='$t';" 2>$null
            if (("$existe".Trim()) -ne "1") { continue }
            $n = & $mysqlExe @argsMy "$($cfg.DB_DATABASE)" -e "SELECT COUNT(*) FROM ``$t``;" 2>$null
            $num = 0
            if ([int]::TryParse(("$n".Trim()), [ref]$num)) {
                L ("    {0,-24} {1,8}" -f $t, $num)
                $filasTotales += $num
            }
        }
        L ""
        L "  Total de filas contadas : $filasTotales"
        $hayDatos = ($filasTotales -gt 0)

        # Imagenes referenciadas en la base: su preocupacion numero uno
        $sqlImg = "SELECT COUNT(*) FROM productos WHERE imagen IS NOT NULL AND imagen <> '';"
        $nImg = & $mysqlExe @argsMy "$($cfg.DB_DATABASE)" -e $sqlImg 2>$null
        if ($LASTEXITCODE -eq 0) {
            L "  Productos con imagen    : $("$nImg".Trim())"
        }

        # Tamano de la base en disco
        $sqlMb = "SELECT ROUND(SUM(data_length+index_length)/1048576,1) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$($cfg.DB_DATABASE)';"
        $mb = & $mysqlExe @argsMy -e $sqlMb 2>$null
        if ($LASTEXITCODE -eq 0) { L "  Tamano de la base       : $("$mb".Trim()) MB" }
    }
}

# =============================================================================
# 7. Imagenes en disco
# =============================================================================
Titulo "7. Imagenes y archivos subidos"

foreach ($carpeta in @("backend\uploads", "backend\uploads-builtin")) {
    $ruta = Join-Path $InstallDir $carpeta
    if (Test-Path $ruta) {
        $arch = @(Get-ChildItem $ruta -Recurse -File -ErrorAction SilentlyContinue)
        $bytes = 0
        if ($arch.Count -gt 0) { $bytes = ($arch | Measure-Object Length -Sum).Sum }
        L "  $carpeta : $($arch.Count) archivos, $(Tam $bytes)"
    } else {
        L "  $carpeta : no existe"
    }
}

# =============================================================================
# 8. Respaldos que ya tiene
# =============================================================================
Titulo "8. Respaldos existentes"

$dirResp = Join-Path $InstallDir "backups"
if (Test-Path $dirResp) {
    $resp = @(Get-ChildItem $dirResp -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
    L "  Carpeta            : $dirResp"
    L "  Respaldos          : $($resp.Count)"
    foreach ($r in ($resp | Select-Object -First 8)) {
        $sql = Join-Path $r.FullName "base-datos.sql"
        $pesoSql = if (Test-Path $sql) { Tam (Get-Item $sql).Length } else { "sin base-datos.sql" }
        L ("    {0,-36} {1}  ({2})" -f $r.Name, $r.LastWriteTime.ToString("yyyy-MM-dd HH:mm"), $pesoSql)
    }
    if ($resp.Count -eq 0) {
        Pendiente "No hay ningun respaldo todavia. Corre RESPALDAR.bat antes de actualizar."
    }
} else {
    L "  No existe la carpeta $dirResp"
    Pendiente "No hay respaldos. Corre RESPALDAR.bat antes de actualizar."
}

# =============================================================================
# 9. Herramientas instaladas
# =============================================================================
Titulo "9. Herramientas de respaldo y reversion"

$herramientas = @("respaldar.ps1","revertir.ps1","actualizar.ps1","ensayar.ps1","mantenimiento.ps1")
$faltanHerr = @()
foreach ($h in $herramientas) {
    $ruta = Join-Path $InstallDir "tools\$h"
    if (Test-Path $ruta) {
        L "  tools\$h : si ($(Tam (Get-Item $ruta).Length))"
    } else {
        L "  tools\$h : NO"
        $faltanHerr += $h
    }
}
if ($faltanHerr.Count -gt 0) {
    Pendiente "Faltan herramientas en tools\ ($($faltanHerr -join ', ')). El instalador nuevo las deja al actualizar."
}

# Motores con los que corre el sistema. La actualizacion NO los reemplaza: el
# programa nuevo se instala sobre el motor que ya esta aqui. Por eso hay que
# poder verlos: si alguna vez no coincidieran con los del paquete, el arranque
# fallaria y sin esta linea nadie sabria por que.
L ""
L "  Motores instalados:"
$nodeExe = Join-Path $InstallDir "node\node.exe"
if (Test-Path $nodeExe) {
    $vNode = ""
    try { $vNode = (& $nodeExe -v 2>$null | Select-Object -First 1) } catch { }
    if ($vNode) { L "    node               : $vNode" } else { L "    node               : esta el archivo pero no respondio" }
} else {
    L "    node               : NO esta $nodeExe"
    Pendiente "No se encontro node.exe en la instalacion. El backend no puede arrancar sin el."
}
$mysqldExe = Join-Path $InstallDir "mariadb\bin\mysqld.exe"
if (Test-Path $mysqldExe) {
    $vDb = ""
    try { $vDb = (& $mysqldExe --version 2>$null | Select-Object -First 1) } catch { }
    if ($vDb) { L "    mariadb            : $vDb" } else { L "    mariadb            : esta el archivo pero no respondio" }
} else {
    L "    mariadb            : NO esta $mysqldExe"
}

# =============================================================================
# 10. Espacio en disco
# =============================================================================
Titulo "10. Espacio en disco"

$unidad = Split-Path -Qualifier $InstallDir
try {
    $libre = (Get-PSDrive -Name $unidad.TrimEnd(":")).Free
    L "  Libre en $unidad : $(Tam $libre)"
    if ($libre -lt 2GB) {
        Pendiente "Quedan menos de 2 GB libres en $unidad. El respaldo podria no caber."
    }
} catch {
    L "  No se pudo medir el espacio libre en $unidad"
}

if (Test-Path $InstallDir) {
    $arch = @(Get-ChildItem $InstallDir -Recurse -File -ErrorAction SilentlyContinue)
    if ($arch.Count -gt 0) {
        L "  Pesa la instalacion: $(Tam (($arch | Measure-Object Length -Sum).Sum)) en $($arch.Count) archivos"
    }
}

# =============================================================================
# Conclusion
# =============================================================================
Titulo "CONCLUSION"

if ($hayDatos) {
    L "  Este equipo TIENE operacion adentro ($filasTotales filas)." "Green"
    L "  El instalador nuevo lo detecta y se va por el camino de ACTUALIZACION:" "Green"
    L "  respalda primero, ensaya contra una copia, y no borra datos." "Green"
} else {
    L "  No se encontraron datos de operacion en la base." "Yellow"
    L "  Revisa que la ruta y el .env sean los correctos antes de instalar." "Yellow"
}

L ""
if ($avisos.Count -eq 0) {
    L "  Sin pendientes. Se puede continuar." "Green"
    $codigo = 0
} else {
    L "  Pendientes a resolver o avisar ($($avisos.Count)):" "Yellow"
    foreach ($a in $avisos) { L "    - $a" "Yellow" }
    $codigo = 2
}

# =============================================================================
# Guardar el reporte
# =============================================================================
# Esta revision no crea carpetas: se escribe donde YA hay una. Si se
# pidio una ruta con -Reporte se respeta tal cual; si no, se intenta la
# carpeta de la instalacion, luego el Escritorio, luego la temporal.
$candidatos = New-Object System.Collections.ArrayList
if ($Reporte) {
    [void]$candidatos.Add($Reporte)
} else {
    if (Test-Path $InstallDir) { [void]$candidatos.Add((Join-Path $InstallDir "REVISION-EQUIPO.txt")) }
    $escritorio = [Environment]::GetFolderPath("Desktop")
    if ($escritorio -and (Test-Path $escritorio)) {
        [void]$candidatos.Add((Join-Path $escritorio "REVISION-EQUIPO.txt"))
    }
    [void]$candidatos.Add((Join-Path $env:TEMP "REVISION-EQUIPO.txt"))
}

$guardado = ""
foreach ($destino in $candidatos) {
    try {
        $lineas -join "`r`n" | Set-Content -Path $destino -Encoding UTF8 -ErrorAction Stop
        $guardado = $destino
        break
    } catch { }
}

Write-Host ""
if ($guardado) {
    Write-Host "  Reporte guardado en:" -ForegroundColor Cyan
    Write-Host "    $guardado" -ForegroundColor Cyan
    Write-Host "  Manda ese archivo completo." -ForegroundColor Cyan
} else {
    Write-Host "  No se pudo guardar el reporte en archivo." -ForegroundColor Yellow
    Write-Host "  Copia el texto de esta pantalla y mandalo." -ForegroundColor Yellow
}
Write-Host ""

exit $codigo
