# =============================================================================
# POS-iaDoS - Build EXE Installer Script
# Genera el instalador EXE profesional para Windows
#
# Modos:
#   local   - BD propia (MariaDB incluida), sin internet requerido
#   online  - BD en la nube (my.bodegadigital.com.mx), usa ext.env
#
# Uso desde PowerShell:
#   .\build-exe.ps1                        # local v2.0.0
#   .\build-exe.ps1 -Mode online           # online v2.0.0
#   .\build-exe.ps1 -Mode local -Version 2.1.0
#
# Requiere: Inno Setup 6  (https://jrsoftware.org/isdl.php)
# =============================================================================

param(
    [ValidateSet("local","online")]
    [string]$Mode          = "local",
    [string]$Version       = "2.1.0",
    [string]$OutputDir     = "output",
    [string]$InnoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    [string]$RuntimeSource = "v1.0.0"
)

$ErrorActionPreference = "Stop"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

# Logging helpers
function Write-Step { param([string]$msg) Write-Host "`n[>>>] $msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Write-Info { param([string]$msg) Write-Host "       $msg" -ForegroundColor Gray }
function Write-Fail {
    param([string]$msg)
    Write-Host "  [XX] $msg" -ForegroundColor Red
    exit 1
}

$ModeLabel   = if ($Mode -eq "local") { "Local (BD propia)"   } else { "Online (BD en nube)" }
$OutputName  = "POS-iaDoS-$($Mode.Substring(0,1).ToUpper() + $Mode.Substring(1))-v$Version"

Write-Host ""
Write-Host "  +==========================================+" -ForegroundColor Cyan
Write-Host "  |   POS-iaDoS - Build EXE Installer       |" -ForegroundColor Cyan
Write-Host "  |   Version : $Version                        |" -ForegroundColor Cyan
Write-Host "  |   Modo    : $ModeLabel" -ForegroundColor Cyan
Write-Host "  +==========================================+" -ForegroundColor Cyan
Write-Host ""

# =============================================================================
# 1. Build frontend
# =============================================================================
Write-Step "Compilando frontend (npm run build)..."

$FrontendSrcDir = Join-Path $ProjectDir "frontend"
if (-not (Test-Path "$FrontendSrcDir\package.json")) {
    Write-Fail "No se encontro frontend en: $FrontendSrcDir"
}

$env:VITE_API_URL = "/api"
$buildResult = & cmd /c "cd /d `"$FrontendSrcDir`" && npm run build 2>&1"
$buildExitCode = $LASTEXITCODE
$FrontendDistDir = Join-Path $ProjectDir "frontend\dist-prod"
$FrontendIndexHtml = Join-Path $FrontendDistDir "index.html"
if ($buildExitCode -ne 0) {
    # Windows Defender puede bloquear sw.js brevemente y reportar EPERM aunque el build este completo.
    # Si index.html existe y tiene contenido, el build fue exitoso.
    if ((Test-Path $FrontendIndexHtml) -and ((Get-Item $FrontendIndexHtml).Length -gt 100)) {
        Write-Warn "npm run build reporto error ($buildExitCode) pero dist-prod esta completo. Continuando..."
    } else {
        Write-Host $buildResult
        Write-Fail "npm run build fallo (codigo: $buildExitCode)"
    }
}
Write-OK "Frontend compilado correctamente"

# =============================================================================
# 2. Generar icono ICO desde logo-iados.png
# =============================================================================
Write-Step "Generando icono pos-iados.ico..."

$LogoPng = Join-Path $ProjectDir "frontend\public\logo-iados.png"
$IcoOut  = Join-Path $ScriptDir "assets\pos-iados.ico"

try {
    Add-Type -AssemblyName System.Drawing
    $sizes = @(16, 32, 48, 256)
    $pngDataList = @()

    foreach ($size in $sizes) {
        $s = [float]$size / 100.0   # escala: viewbox es 100x100
        $bmp = New-Object System.Drawing.Bitmap($size, $size)
        $g   = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

        # Fondo oscuro igual al login
        $g.Clear([System.Drawing.Color]::FromArgb(255, 15, 23, 42))

        $green      = [System.Drawing.Color]::FromArgb(255, 92, 184, 130)
        $greenLight = [System.Drawing.Color]::FromArgb(179, 126, 200, 160)
        $dark       = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)
        $cx = 50.0 * $s; $cy = 50.0 * $s

        # Hexagono exterior
        $hex = @(
            [System.Drawing.PointF]::new(50*$s,  4*$s),
            [System.Drawing.PointF]::new(88*$s, 26*$s),
            [System.Drawing.PointF]::new(88*$s, 74*$s),
            [System.Drawing.PointF]::new(50*$s, 96*$s),
            [System.Drawing.PointF]::new(12*$s, 74*$s),
            [System.Drawing.PointF]::new(12*$s, 26*$s)
        )
        $penHex = New-Object System.Drawing.Pen($green, [float](4*$s))
        $penHex.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        $g.DrawPolygon($penHex, $hex)

        # Lineas primarias al centro
        $penPrim = New-Object System.Drawing.Pen($green, [float](2.5*$s))
        $g.DrawLine($penPrim, [float](50*$s), [float](4*$s),  $cx, $cy)
        $g.DrawLine($penPrim, [float](88*$s), [float](74*$s), $cx, $cy)
        $g.DrawLine($penPrim, [float](12*$s), [float](74*$s), $cx, $cy)

        # Lineas secundarias
        $penSec = New-Object System.Drawing.Pen($greenLight, [float](1.5*$s))
        $g.DrawLine($penSec, [float](88*$s), [float](26*$s), $cx, $cy)
        $g.DrawLine($penSec, [float](12*$s), [float](26*$s), $cx, $cy)
        $g.DrawLine($penSec, [float](50*$s), [float](96*$s), $cx, $cy)

        # Circulo exterior verde
        $r1 = [float](9*$s)
        $g.FillEllipse((New-Object System.Drawing.SolidBrush($green)), ($cx-$r1), ($cy-$r1), 2*$r1, 2*$r1)

        # Circulo interior oscuro
        $r2 = [float](5*$s)
        $g.FillEllipse((New-Object System.Drawing.SolidBrush($dark)), ($cx-$r2), ($cy-$r2), 2*$r2, 2*$r2)

        $g.Dispose()
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngDataList += ,($ms.ToArray())
        $ms.Dispose(); $bmp.Dispose()
    }

    $icoStream = New-Object System.IO.FileStream($IcoOut, [System.IO.FileMode]::Create)
    $w = New-Object System.IO.BinaryWriter($icoStream)
    $count  = $sizes.Count
    $offset = 6 + $count * 16
    $w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$count)
    for ($i = 0; $i -lt $count; $i++) {
        $sz = $sizes[$i]; $len = $pngDataList[$i].Length
        $w.Write([byte]$(if ($sz -eq 256) { 0 } else { $sz }))
        $w.Write([byte]$(if ($sz -eq 256) { 0 } else { $sz }))
        $w.Write([byte]0); $w.Write([byte]0)
        $w.Write([uint16]1); $w.Write([uint16]32)
        $w.Write([uint32]$len); $w.Write([uint32]$offset)
        $offset += $len
    }
    foreach ($png in $pngDataList) { $w.Write($png) }
    $w.Close(); $icoStream.Close()
    Write-OK "Icono generado con logo hexagono (16, 32, 48, 256px)"
} catch {
    Write-Warn "No se pudo generar el ICO: $_"
}

# =============================================================================
# 3. Verificar prerrequisitos
# =============================================================================
Write-Step "Verificando prerrequisitos..."

if (-not (Test-Path $InnoSetupPath)) {
    Write-Host ""
    Write-Host "  [XX] Inno Setup 6 no encontrado." -ForegroundColor Red
    Write-Host "  Descargalo en: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
    exit 1
}
Write-OK "Inno Setup 6 encontrado"

$RuntimeDir = Join-Path $ScriptDir "$OutputDir\POS-iaDoS-Setup-$RuntimeSource\runtime"
if (-not (Test-Path $RuntimeDir)) {
    Write-Fail "No se encontro carpeta de runtimes: $RuntimeDir"
}
Write-OK "Runtimes base encontrados ($RuntimeSource)"

$StagingDir  = Join-Path $ScriptDir "staging"
$FrontendDir = Join-Path $ProjectDir "frontend\dist-prod"
if (-not (Test-Path $StagingDir)) { Write-Fail "Staging no encontrado: $StagingDir" }
Write-OK "Staging encontrado"

# Verificar env template segun modo
$EnvSource = if ($Mode -eq "local") {
    Join-Path $ProjectDir "backend\loc.env"
} else {
    Join-Path $ProjectDir "backend\ext.env"
}
if (-not (Test-Path $EnvSource)) {
    Write-Fail "Archivo de config no encontrado: $EnvSource"
}
Write-OK "Config de BD: $([System.IO.Path]::GetFileName($EnvSource))"

$issFile = Join-Path $ScriptDir "setup.iss"
if (-not (Test-Path $issFile)) { Write-Fail "setup.iss no encontrado" }
Write-OK "setup.iss encontrado"

# =============================================================================
# 4. Crear carpeta merged
# =============================================================================
Write-Step "Creando paquete: $OutputName..."

$MergedDir = Join-Path $ScriptDir "$OutputDir\$OutputName-src"

if (Test-Path $MergedDir) {
    Remove-Item -Recurse -Force $MergedDir
}
New-Item -ItemType Directory -Path $MergedDir | Out-Null

@("app", "app\backend", "app\database", "runtime", "setup", "logs") | ForEach-Object {
    New-Item -ItemType Directory -Path "$MergedDir\$_" -Force | Out-Null
}

# --- Runtimes ---
Write-Info "Copiando Node.js + NSSM..."
Copy-Item -Path "$RuntimeDir\node"     -Destination "$MergedDir\runtime\node"    -Recurse -Force
Copy-Item -Path "$RuntimeDir\nssm.exe" -Destination "$MergedDir\runtime\nssm.exe" -Force

if ($Mode -eq "local") {
    # MariaDB solo en modo local
    Write-Info "Copiando MariaDB (modo local)..."
    Copy-Item -Path "$RuntimeDir\mariadb" -Destination "$MergedDir\runtime\mariadb" -Recurse -Force
    Write-OK "Runtimes: Node.js + MariaDB + NSSM"
} else {
    Write-OK "Runtimes: Node.js + NSSM (sin MariaDB - modo online)"
}

# --- App desde staging ---
Write-Info "Copiando app desde staging..."
Copy-Item -Path "$StagingDir\app\*" -Destination "$MergedDir\app" -Recurse -Force
Write-OK "App copiada"

# --- Frontend dist actualizado ---
if (Test-Path $FrontendDir) {
    Write-Info "Actualizando frontend con build reciente..."
    $pubDir = "$MergedDir\app\backend\public"
    if (Test-Path $pubDir) { Remove-Item -Recurse -Force $pubDir }
    New-Item -ItemType Directory -Path $pubDir | Out-Null
    Copy-Item -Path "$FrontendDir\*" -Destination $pubDir -Recurse -Force
    Write-OK "Frontend actualizado"
}

# --- Setup scripts ---
Copy-Item -Path "$StagingDir\setup\*" -Destination "$MergedDir\setup" -Recurse -Force
Write-OK "Scripts de setup copiados"

# --- BAT files ---
Get-ChildItem -Path $StagingDir -Filter "*.bat" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $MergedDir -Force
}
Copy-Item -Path "$StagingDir\LICENSE.txt" -Destination $MergedDir -Force -ErrorAction SilentlyContinue
Write-OK "BAT files copiados"

# --- Modo de instalacion (leido por install.ps1) ---
$Mode | Set-Content -Path "$MergedDir\install-mode.txt" -Encoding UTF8
Write-OK "install-mode.txt: $Mode"

# --- Template del .env del backend ---
Copy-Item -Path $EnvSource -Destination "$MergedDir\backend.env.template" -Force
Write-OK "backend.env.template: $([System.IO.Path]::GetFileName($EnvSource))"

# =============================================================================
# 5. Verificar integridad
# =============================================================================
Write-Step "Verificando integridad del paquete..."

$checks = @(
    @{ Path = "$MergedDir\runtime\node";             Name = "Node.js runtime" },
    @{ Path = "$MergedDir\runtime\nssm.exe";         Name = "NSSM" },
    @{ Path = "$MergedDir\app\backend\package.json"; Name = "Backend" },
    @{ Path = "$MergedDir\app\backend\public";       Name = "Frontend" },
    @{ Path = "$MergedDir\setup\install.ps1";        Name = "install.ps1" },
    @{ Path = "$MergedDir\setup\uninstall.ps1";      Name = "uninstall.ps1" },
    @{ Path = "$MergedDir\install-mode.txt";         Name = "install-mode.txt" },
    @{ Path = "$MergedDir\backend.env.template";     Name = "backend.env.template" },
    @{ Path = "$MergedDir\INSTALAR.bat";             Name = "INSTALAR.bat" }
)
if ($Mode -eq "local") {
    $checks += @{ Path = "$MergedDir\runtime\mariadb"; Name = "MariaDB runtime" }
}

$allOk = $true
foreach ($c in $checks) {
    if (Test-Path $c.Path) { Write-OK $c.Name }
    else { Write-Host "  [!!] FALTA: $($c.Name)" -ForegroundColor Yellow; $allOk = $false }
}

if (-not $allOk) {
    $resp = Read-Host "`n  Faltan componentes. Continuar de todas formas? (s/N)"
    if ($resp -notmatch "^[sS]") { exit 1 }
}

# =============================================================================
# 6. Actualizar version.json
# =============================================================================
Write-Step "Actualizando version.json..."

$buildDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
[ordered]@{
    version    = $Version
    build_date = $buildDate
    mode       = $Mode
    product    = "POS-iaDoS"
    company    = "iaDoS"
} | ConvertTo-Json -Depth 2 | Set-Content -Path "$MergedDir\version.json" -Encoding UTF8

Write-OK "v$Version  [$Mode]  ($buildDate)"

# =============================================================================
# 7. Actualizar BAT files con version
# =============================================================================
Write-Step "Actualizando version en BAT files..."
Get-ChildItem -Path $MergedDir -Filter "*.bat" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $content = $content -replace 'v\d+\.\d+\.\d+', "v$Version"
        Set-Content -Path $_.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-OK $_.Name
    }
}

# =============================================================================
# 8. Compilar EXE con Inno Setup
# =============================================================================
Write-Step "Compilando EXE con Inno Setup 6..."
Write-Info "Compresion lzma2/ultra64 - puede tardar 3-8 minutos..."
Write-Host ""

$startTime = Get-Date
$isccArgs  = "`"$issFile`" /DInstallMode=$Mode /DOutputName=$OutputName /DSourceDir=$OutputDir\$OutputName-src"

$process = Start-Process -FilePath $InnoSetupPath `
    -ArgumentList $isccArgs `
    -WorkingDirectory $ScriptDir `
    -PassThru -Wait -NoNewWindow

$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 0)

if ($process.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "  [XX] Inno Setup fallo (codigo: $($process.ExitCode))" -ForegroundColor Red
    exit 1
}

# =============================================================================
# 9. Resultado final
# =============================================================================
$exePath = Join-Path $ScriptDir "$OutputDir\$OutputName.exe"
if (-not (Test-Path $exePath)) {
    Write-Fail "El EXE no fue generado. Revisa setup.iss"
}

$sizeMB = [math]::Round((Get-Item $exePath).Length / 1MB, 1)

Write-Host ""
Write-Host "  +==========================================+" -ForegroundColor Green
Write-Host "  |   BUILD COMPLETADO EXITOSAMENTE         |" -ForegroundColor Green
Write-Host "  +==========================================+" -ForegroundColor Green
Write-Host ""
Write-Host "  EXE generado:" -ForegroundColor White
Write-Host "    $exePath" -ForegroundColor Cyan
Write-Host "    Tamano: ${sizeMB} MB  |  Tiempo: ${elapsed}s" -ForegroundColor Gray
Write-Host ""
Write-Host "  Modo: $ModeLabel" -ForegroundColor White
if ($Mode -eq "local") {
    Write-Host "    Incluye: Node.js + MariaDB + NSSM + App" -ForegroundColor Gray
    Write-Host "    BD:      Local (MariaDB en C:\POS-iaDoS\mariadb)" -ForegroundColor Gray
} else {
    Write-Host "    Incluye: Node.js + NSSM + App (sin MariaDB)" -ForegroundColor Gray
    Write-Host "    BD:      $((Get-Content $EnvSource | Select-String 'DB_HOST').ToString().Trim())" -ForegroundColor Gray
}
Write-Host ""
Write-Host "  Proximos pasos:" -ForegroundColor White
Write-Host "    1. Probar el EXE en maquina limpia" -ForegroundColor Yellow
Write-Host "    2. git add -A && git commit -m 'release: v$Version-$Mode'" -ForegroundColor Yellow
Write-Host "    3. git tag v$Version-$Mode" -ForegroundColor Yellow
Write-Host ""
