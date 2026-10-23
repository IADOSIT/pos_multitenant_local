# =============================================================================
# POS-iaDoS - Publicar una actualizacion para el boton "Sincronizar"
#
# Arma el paquete que baja el boton Sincronizar de una instalacion en sitio y
# el aviso (feed.json) que ese boton consulta. Los dos quedan en
#   backend\uploads\actualizaciones\
# que el servidor publica en
#   https://pos.iados.online/api/uploads/actualizaciones/
# en cuanto se hace push y el Pull & Redeploy.
#
# El paquete sale del -src que armo build-exe.ps1 para el EXE de la MISMA
# version, no de las carpetas del proyecto: lo que baja el boton es lo mismo
# que trae el EXE que ya se reviso. Si no hay -src, primero se corre:
#   .\build-exe.ps1 -Mode local -Version X.Y.Z
#
# Uso:
#   .\publicar-actualizacion.ps1 -Version 2.4.5 -Notas "Que trae esta version"
#   .\publicar-actualizacion.ps1 -Version 2.4.6 -ConLibrerias
#
# -ConLibrerias mete node_modules (el paquete pasa de unos MB a cientos). Solo
# hace falta si la version nueva cambio librerias; sin ellas, el sistema del
# cliente revisa el package-lock y si le falta alguna dice "usa el .exe" sin
# tocar nada.
#
# El paquete queda publico. Por eso entra solo lo que se lista aqui abajo
# (programa, pantallas, herramientas de mantenimiento) y NUNCA: .env,
# backend.env.template, install.ps1 (trae la contrasena inicial de la base de
# una instalacion nueva), install-mode.txt, runtime\, uploads\ ni logs\.
# =============================================================================

param(
    [Parameter(Mandatory = $true)][string]$Version,
    [string]$Notas     = "",
    [string]$OutputDir = "output",
    [string]$UrlBase   = "https://pos.iados.online/api/uploads/actualizaciones",
    [switch]$ConLibrerias
)

$ErrorActionPreference = "Stop"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

function Write-Step { param([string]$msg) Write-Host "`n[>>>] $msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Write-Info { param([string]$msg) Write-Host "       $msg" -ForegroundColor Gray }
function Write-Fail {
    param([string]$msg)
    Write-Host "  [XX] $msg" -ForegroundColor Red
    exit 1
}

# Igual que en build-exe.ps1: UTF-8 sin los tres bytes EF BB BF que mete
# Set-Content -Encoding UTF8. Con ellos JSON.parse truena en el equipo del
# cliente y el boton dice "el aviso no es valido".
function Set-TextoSinBOM {
    param(
        [Parameter(Mandatory = $true)][string]$Ruta,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Texto
    )
    $sinBOM = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Ruta, $Texto, $sinBOM)
}

function Copiar-Carpeta {
    param([string]$Origen, [string]$Destino, [string]$Etiqueta)
    if (-not (Test-Path $Origen)) { Write-Fail "Falta $Etiqueta en $Origen" }
    & robocopy $Origen $Destino /E /NP /NFL /NDL /LOG:NUL | Out-Null
    if ($LASTEXITCODE -ge 8) { Write-Fail "robocopy de $Etiqueta fallo (codigo $LASTEXITCODE)" }
}

if ($Version -notmatch '^\d+\.\d+\.\d+$') { Write-Fail "Version invalida: '$Version' (se espera X.Y.Z)" }

Write-Host ""
Write-Host "  POS-iaDoS - Publicar actualizacion v$Version para Sincronizar" -ForegroundColor Cyan

# =============================================================================
# 1. El -src del EXE de esta version
# =============================================================================
Write-Step "Revisando el paquete armado por build-exe.ps1..."

$Src = Join-Path $ScriptDir "$OutputDir\POS-iaDoS-Local-v$Version-src"
if (-not (Test-Path $Src)) {
    Write-Fail "No existe $Src. Corre primero: .\build-exe.ps1 -Mode local -Version $Version"
}
$vjSrc = Join-Path $Src "version.json"
if (-not (Test-Path $vjSrc)) { Write-Fail "El -src no trae version.json" }
$vSrc = (Get-Content $vjSrc -Raw -Encoding UTF8 | ConvertFrom-Json).version
if ($vSrc -ne $Version) { Write-Fail "El -src dice ser la $vSrc, no la $Version" }

$srcBackend = Join-Path $Src "app\backend"
$requeridos = @(
    @{ R = "$srcBackend\dist\main.js";          N = "programa (dist\main.js)" },
    @{ R = "$srcBackend\public\index.html";     N = "pantallas (public\index.html)" },
    @{ R = "$srcBackend\package.json";          N = "package.json" },
    @{ R = "$srcBackend\package-lock.json";     N = "package-lock.json" },
    @{ R = "$Src\setup\actualizar.ps1";         N = "actualizar.ps1" },
    @{ R = "$Src\setup\respaldar.ps1";          N = "respaldar.ps1" },
    @{ R = "$Src\setup\revertir.ps1";           N = "revertir.ps1" },
    @{ R = "$Src\setup\node\comun.js";          N = "herramientas node" }
)
foreach ($q in $requeridos) {
    if (-not (Test-Path $q.R)) { Write-Fail "Al -src le falta: $($q.N)" }
}
$nPublic = @(Get-ChildItem "$srcBackend\public" -Recurse -File).Count
if ($nPublic -lt 100) { Write-Fail "Las pantallas del -src estan incompletas ($nPublic archivos)" }
if ($ConLibrerias -and -not (Test-Path "$srcBackend\node_modules")) {
    Write-Fail "Se pidio -ConLibrerias y el -src no trae node_modules"
}
Write-OK "-src v$Version completo ($nPublic archivos de pantallas)"

# =============================================================================
# 2. Armar el paquete en una carpeta temporal
# =============================================================================
Write-Step "Armando el paquete..."

$Tmp      = Join-Path $env:TEMP ("pos-publicar-" + [guid]::NewGuid().ToString("N"))
$Paquete  = Join-Path $Tmp "paquete"
$Prueba   = Join-Path $Tmp "prueba"
$ZipTmp   = Join-Path $Tmp "paquete.zip"
New-Item -ItemType Directory -Path $Paquete -Force | Out-Null

try {
    $pkgBackend = Join-Path $Paquete "app\backend"
    New-Item -ItemType Directory -Path $pkgBackend -Force | Out-Null

    Copiar-Carpeta -Origen "$srcBackend\dist"   -Destino "$pkgBackend\dist"   -Etiqueta "backend\dist"
    Copiar-Carpeta -Origen "$srcBackend\public" -Destino "$pkgBackend\public" -Etiqueta "pantallas"
    Copy-Item "$srcBackend\package.json"      "$pkgBackend\package.json"      -Force
    Copy-Item "$srcBackend\package-lock.json" "$pkgBackend\package-lock.json" -Force
    if ($ConLibrerias) {
        Copiar-Carpeta -Origen "$srcBackend\node_modules" -Destino "$pkgBackend\node_modules" -Etiqueta "node_modules"
    }

    # Herramientas de mantenimiento: actualizar.ps1 las copia a <InstallDir>\tools
    # para que el respaldo y el revert del futuro sean los de esta version.
    # install.ps1 se queda fuera a proposito (ver encabezado).
    $pkgSetup = Join-Path $Paquete "setup"
    New-Item -ItemType Directory -Path $pkgSetup -Force | Out-Null
    $fueraDelPaquete = @("install.ps1")
    foreach ($f in (Get-ChildItem -Path "$Src\setup" -Filter "*.ps1" -File)) {
        if ($fueraDelPaquete -contains $f.Name) { continue }
        Copy-Item $f.FullName (Join-Path $pkgSetup $f.Name) -Force
    }
    Copiar-Carpeta -Origen "$Src\setup\node" -Destino "$pkgSetup\node" -Etiqueta "setup\node"

    Copy-Item $vjSrc (Join-Path $Paquete "version.json") -Force

    # Ultima revision antes de comprimir: nada con cara de configuracion o
    # secreto, aunque alguien lo haya dejado caer en una de esas carpetas.
    $prohibidos = @(Get-ChildItem -Path $Paquete -Recurse -File -Force | Where-Object {
        $_.Name -like ".env*" -or $_.Name -like "*.env" -or $_.Name -like "*.template" -or
        $_.Name -eq "install-mode.txt" -or $_.Name -eq "install.ps1"
    })
    if ($prohibidos.Count -gt 0) {
        $prohibidos | ForEach-Object { Write-Host "    $($_.FullName.Substring($Paquete.Length + 1))" -ForegroundColor Red }
        Write-Fail "El paquete traeria archivos de configuracion. No se publica."
    }

    $nArchivos = @(Get-ChildItem -Path $Paquete -Recurse -File).Count
    $mbPaquete = [math]::Round(((Get-ChildItem -Path $Paquete -Recurse -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
    Write-OK "Paquete: $nArchivos archivos, $mbPaquete MB sin comprimir"

    # =========================================================================
    # 3. Comprimir y sacar la huella
    # =========================================================================
    Write-Step "Comprimiendo..."
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $Paquete, $ZipTmp, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    $sha256 = (Get-FileHash -Path $ZipTmp -Algorithm SHA256).Hash.ToLower()
    $bytes  = [long](Get-Item $ZipTmp).Length
    $lockSha = (Get-FileHash -Path "$pkgBackend\package-lock.json" -Algorithm SHA256).Hash.ToLower()
    Write-OK "Zip: $([math]::Round($bytes / 1MB, 1)) MB  sha256 $sha256"

    # =========================================================================
    # 4. Probar el zip igual que lo abre el equipo del cliente
    # =========================================================================
    # mantenimiento.service.ts lo abre con Expand-Archive y luego busca
    # version.json, app\backend\dist\main.js y las pantallas. Si aqui no sale
    # igual, alla tampoco.
    Write-Step "Probando el zip como lo abre el boton Sincronizar..."
    Expand-Archive -LiteralPath $ZipTmp -DestinationPath $Prueba -Force
    $raiz = $Prueba
    $hijos = @(Get-ChildItem -Path $raiz -Force)
    if ($hijos.Count -eq 1 -and $hijos[0].PSIsContainer) { $raiz = $hijos[0].FullName }
    foreach ($rel in @("version.json", "app\backend\dist\main.js", "app\backend\public\index.html",
                       "app\backend\package-lock.json", "setup\actualizar.ps1")) {
        if (-not (Test-Path (Join-Path $raiz $rel))) { Write-Fail "El zip no trae $rel al abrirlo" }
    }
    $vZip = (Get-Content (Join-Path $raiz "version.json") -Raw -Encoding UTF8 | ConvertFrom-Json).version
    if ($vZip -ne $Version) { Write-Fail "El zip dice ser la $vZip" }
    $nPrueba = @(Get-ChildItem -Path $raiz -Recurse -File).Count
    if ($nPrueba -ne $nArchivos) { Write-Fail "Al abrir el zip salen $nPrueba archivos de $nArchivos" }
    Write-OK "El zip abre completo: $nPrueba archivos, version $vZip"

    # =========================================================================
    # 5. Dejarlo donde lo publica el servidor
    # =========================================================================
    Write-Step "Publicando en backend\uploads\actualizaciones..."
    $DestDir = Join-Path $ProjectDir "backend\uploads\actualizaciones"
    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null

    # La huella va en el nombre: si se vuelve a publicar la misma version con
    # otro contenido, ningun cache (Cloudflare guarda los .zip) puede entregar
    # el viejo con la huella nueva.
    $zipNombre = "POS-iaDoS-UPDATE-v$Version-$($sha256.Substring(0, 8)).zip"
    $zipFinal  = Join-Path $DestDir $zipNombre

    # Solo queda el paquete vigente. El anterior ya no se ofrece (el aviso
    # apunta a uno solo) y cada uno pesa megas en el repositorio.
    Get-ChildItem -Path $DestDir -Filter "POS-iaDoS-UPDATE-*.zip" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -ne $zipNombre } |
        ForEach-Object { Remove-Item $_.FullName -Force; Write-Info "Se quito el paquete anterior: $($_.Name)" }
    Copy-Item $ZipTmp $zipFinal -Force
    if ((Get-FileHash -Path $zipFinal -Algorithm SHA256).Hash.ToLower() -ne $sha256) {
        Write-Fail "La copia del zip no coincide con el original"
    }

    if (-not $Notas) { $Notas = "Version $Version de POS-iaDoS." }
    $aviso = [ordered]@{
        version       = $Version
        notas         = $Notas
        url           = "$($UrlBase.TrimEnd('/'))/$zipNombre"
        sha256        = $sha256
        bytes         = $bytes
        lock_sha256   = $lockSha
        con_librerias = [bool]$ConLibrerias
        fecha         = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
    $feedPath = Join-Path $DestDir "feed.json"
    Set-TextoSinBOM -Ruta $feedPath -Texto ($aviso | ConvertTo-Json -Depth 3)

    # Las mismas reglas con las que el equipo del cliente decide si confia en
    # el aviso (problemaDelAviso en mantenimiento.service.ts).
    $primeros = [System.IO.File]::ReadAllBytes($feedPath)[0..2]
    if ($primeros[0] -eq 0xEF -and $primeros[1] -eq 0xBB -and $primeros[2] -eq 0xBF) {
        Write-Fail "feed.json quedo con marca BOM"
    }
    $leido = Get-Content $feedPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $uFeed = [Uri]"$($UrlBase.TrimEnd('/'))/feed.json"
    $uZip  = [Uri]$leido.url
    if ($leido.version -ne $Version)                    { Write-Fail "feed.json: version distinta" }
    if ($uZip.Scheme -ne "https")                       { Write-Fail "feed.json: el paquete no va por https" }
    if ($uZip.Authority -ne $uFeed.Authority)           { Write-Fail "feed.json: el paquete no esta en el mismo servidor que el aviso" }
    if ($leido.sha256 -notmatch '^[a-f0-9]{64}$')       { Write-Fail "feed.json: huella invalida" }
    if ([long]$leido.bytes -ne $bytes -or $bytes -le 0) { Write-Fail "feed.json: tamano invalido" }
    Write-OK "feed.json valido"

    Write-Host ""
    Write-Host "  ======================================================================" -ForegroundColor Green
    Write-Host "   ACTUALIZACION v$Version LISTA PARA PUBLICAR" -ForegroundColor Green
    Write-Host "   $zipFinal" -ForegroundColor Green
    Write-Host "   $feedPath" -ForegroundColor Green
    Write-Host "  ======================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Falta subirlo (por ruta explicita, nunca git add -A):" -ForegroundColor White
    Write-Host "    git add backend/uploads/actualizaciones/feed.json backend/uploads/actualizaciones/$zipNombre" -ForegroundColor Yellow
    Write-Host "    (y git rm del zip anterior si estaba en git)" -ForegroundColor Yellow
    Write-Host "  Despues del push y el Pull & Redeploy, revisa:" -ForegroundColor White
    Write-Host "    $($UrlBase.TrimEnd('/'))/feed.json" -ForegroundColor Yellow
    Write-Host ""
} finally {
    Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
}
exit 0
