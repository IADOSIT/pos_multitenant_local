# =============================================================================
# POS-iaDoS - Preparar runtimes para el instalador
#
# Arma installer\staging\runtime\ con lo que el EXE tiene que llevar adentro:
#
#   staging\runtime\node\node.exe          Node.js empaquetado
#   staging\runtime\mariadb\bin\mysqld.exe MariaDB 10.11.7 empaquetada
#   staging\runtime\nssm.exe               NSSM (servicios de Windows)
#
# Los tres salen de los ZIP ya descargados en installer\.downloads\, asi que
# esto NO necesita internet.
#
# Es idempotente: si ya estan y verifican bien, no vuelve a extraer nada.
#
# Uso:
#   .\preparar-runtimes.ps1
#   .\preparar-runtimes.ps1 -Forzar      vuelve a extraer aunque ya existan
# =============================================================================
param(
    [switch]$Forzar,
    [switch]$Silencioso
)

$ErrorActionPreference = "Stop"

$DIR        = $PSScriptRoot
$DESCARGAS  = Join-Path $DIR ".downloads"
$RUNTIME    = Join-Path $DIR "staging\runtime"

function Escribir { param([string]$t, [string]$c = "Gray") if (-not $Silencioso) { Write-Host $t -ForegroundColor $c } }
function Paso     { param([string]$t) Escribir "`n[>>>] $t" "Cyan" }
function Ok       { param([string]$t) Escribir "  [OK] $t" "Green" }
function Aviso    { param([string]$t) Escribir "  [!!] $t" "Yellow" }
function Falla    { param([string]$t) Write-Host "  [XX] $t" -ForegroundColor Red; exit 1 }

Escribir ""
Escribir "  POS-iaDoS - Preparando runtimes del instalador" "Cyan"
Escribir "  ============================================" "Cyan"

if (-not (Test-Path $DESCARGAS)) {
    Falla "No existe $DESCARGAS. Sin los ZIP de Node/MariaDB/NSSM no se puede armar el EXE."
}

New-Item -ItemType Directory -Path $RUNTIME -Force | Out-Null

# -----------------------------------------------------------------------------
# Expand-Archive es lento y, en carpetas grandes, puede tronar por rutas largas.
# 7-Zip (si esta) es mas rapido y aguanta rutas largas; si no esta, cae a
# Expand-Archive, que para estos ZIP alcanza.
# -----------------------------------------------------------------------------
$SIETEZIP = $null
foreach ($c in @("C:\Program Files\7-Zip\7z.exe", "C:\Program Files (x86)\7-Zip\7z.exe")) {
    if (Test-Path $c) { $SIETEZIP = $c; break }
}

function Descomprimir {
    param([string]$Zip, [string]$Destino)

    if (Test-Path $Destino) { Remove-Item -Recurse -Force $Destino -ErrorAction SilentlyContinue }
    New-Item -ItemType Directory -Path $Destino -Force | Out-Null

    if ($SIETEZIP) {
        & $SIETEZIP x "$Zip" "-o$Destino" -y -bso0 -bsp0 | Out-Null
        if ($LASTEXITCODE -ne 0) { Falla "7z no pudo extraer $Zip (codigo $LASTEXITCODE)" }
    } else {
        Expand-Archive -Path $Zip -DestinationPath $Destino -Force
    }
}

# =============================================================================
# 1. NSSM
# =============================================================================
Paso "NSSM (administrador de servicios)"
$nssmDestino = Join-Path $RUNTIME "nssm.exe"

if ((Test-Path $nssmDestino) -and -not $Forzar) {
    Ok "ya estaba ($([math]::Round((Get-Item $nssmDestino).Length / 1KB, 0)) KB)"
} else {
    $zip = Join-Path $DESCARGAS "nssm.zip"
    if (-not (Test-Path $zip)) { Falla "Falta $zip" }

    $tmp = Join-Path $DESCARGAS "_tmp-nssm"
    Descomprimir -Zip $zip -Destino $tmp

    # Se exige win64 a proposito: Windows 11 Pro es de 64 bits y el nssm de 32
    # no puede administrar el mysqld de 64.
    $exe = Get-ChildItem -Path $tmp -Recurse -Filter "nssm.exe" -ErrorAction SilentlyContinue |
           Where-Object { $_.Directory.Name -eq "win64" } | Select-Object -First 1
    if (-not $exe) { Falla "El nssm.zip no trae win64\nssm.exe" }

    Copy-Item -Path $exe.FullName -Destination $nssmDestino -Force
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    Ok "extraido ($([math]::Round((Get-Item $nssmDestino).Length / 1KB, 0)) KB)"
}

# =============================================================================
# 2. Node.js
# =============================================================================
Paso "Node.js"
$nodeDestino = Join-Path $RUNTIME "node"
$nodeExe     = Join-Path $nodeDestino "node.exe"

if ((Test-Path $nodeExe) -and -not $Forzar) {
    Ok "ya estaba ($(& $nodeExe --version 2>&1))"
} else {
    $zip = Join-Path $DESCARGAS "node.zip"
    if (-not (Test-Path $zip)) { Falla "Falta $zip" }

    $tmp = Join-Path $DESCARGAS "_tmp-node"
    Descomprimir -Zip $zip -Destino $tmp

    # El zip oficial trae una sola carpeta raiz (node-vX.Y.Z-win-x64).
    $raiz = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
    if (-not $raiz) { Falla "El node.zip no trae la carpeta esperada adentro" }
    if (-not (Test-Path (Join-Path $raiz.FullName "node.exe"))) {
        Falla "No se encontro node.exe dentro de $($raiz.Name)"
    }

    if (Test-Path $nodeDestino) { Remove-Item -Recurse -Force $nodeDestino -ErrorAction SilentlyContinue }
    New-Item -ItemType Directory -Path $nodeDestino -Force | Out-Null
    & robocopy "$($raiz.FullName)" "$nodeDestino" /E /NP /NFL /NDL /NJH /NJS /LOG:NUL | Out-Null

    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    if (-not (Test-Path $nodeExe)) { Falla "node.exe no quedo en $nodeDestino" }
    Ok "extraido ($(& $nodeExe --version 2>&1))"
}

# =============================================================================
# 3. MariaDB
# =============================================================================
Paso "MariaDB"
$mdbDestino = Join-Path $RUNTIME "mariadb"
$mysqld     = Join-Path $mdbDestino "bin\mysqld.exe"

if ((Test-Path $mysqld) -and -not $Forzar) {
    Ok "ya estaba"
} else {
    $zip = Join-Path $DESCARGAS "mariadb.zip"
    if (-not (Test-Path $zip)) { Falla "Falta $zip" }

    $tmp = Join-Path $DESCARGAS "_tmp-mariadb"
    Descomprimir -Zip $zip -Destino $tmp

    $raiz = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
    if (-not $raiz) { Falla "El mariadb.zip no trae la carpeta esperada adentro" }
    if (-not (Test-Path (Join-Path $raiz.FullName "bin\mysqld.exe"))) {
        Falla "No se encontro bin\mysqld.exe dentro de $($raiz.Name)"
    }

    if (Test-Path $mdbDestino) { Remove-Item -Recurse -Force $mdbDestino -ErrorAction SilentlyContinue }
    New-Item -ItemType Directory -Path $mdbDestino -Force | Out-Null
    & robocopy "$($raiz.FullName)" "$mdbDestino" /E /NP /NFL /NDL /NJH /NJS /LOG:NUL | Out-Null

    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    if (-not (Test-Path $mysqld)) { Falla "mysqld.exe no quedo en $mdbDestino" }
    Ok "extraido"
}

# =============================================================================
# 4. Verificacion final: las piezas exactas que install.ps1 va a buscar
# =============================================================================
Paso "Verificando"

$exigidos = @(
    @{ Ruta = Join-Path $RUNTIME "nssm.exe";                   Nombre = "nssm.exe" },
    @{ Ruta = Join-Path $RUNTIME "node\node.exe";              Nombre = "node\node.exe" },
    @{ Ruta = Join-Path $RUNTIME "mariadb\bin\mysqld.exe";     Nombre = "mariadb\bin\mysqld.exe (servidor)" },
    @{ Ruta = Join-Path $RUNTIME "mariadb\bin\mysql.exe";      Nombre = "mariadb\bin\mysql.exe (cliente)" },
    @{ Ruta = Join-Path $RUNTIME "mariadb\bin\mysqldump.exe";  Nombre = "mariadb\bin\mysqldump.exe (respaldos)" }
)

$faltan = @()
foreach ($e in $exigidos) {
    if (Test-Path $e.Ruta) { Ok $e.Nombre } else { Aviso "FALTA: $($e.Nombre)"; $faltan += $e.Nombre }
}

# mysql_install_db.exe no es obligatorio: install.ps1 cae a
# "mysqld --initialize-insecure" cuando no esta. Solo se informa.
if (Test-Path (Join-Path $RUNTIME "mariadb\bin\mysql_install_db.exe")) {
    Ok "mariadb\bin\mysql_install_db.exe (inicializador)"
} else {
    Aviso "sin mysql_install_db.exe; se usara mysqld --initialize-insecure"
}

if ($faltan.Count -gt 0) {
    Falla "Faltan piezas del runtime: $($faltan -join ', '). El EXE no serviria."
}

$tam = [math]::Round(((Get-ChildItem $RUNTIME -Recurse -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
Escribir ""
Ok "Runtimes listos en staging\runtime ($tam MB)"
Escribir ""
exit 0
