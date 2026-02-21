# =============================================================================
# POS-iaDoS - Build EXE Installer Script
# Genera el instalador EXE profesional para Windows
#
# Estrategia:
#   - Runtimes:  output\POS-iaDoS-Setup-v1.0.0\runtime\  (node, mariadb, nssm)
#   - App + BD:  staging\app\                              (backend + database)
#   - Scripts:   staging\setup\                            (install/uninstall/etc)
#   - Frontend:  frontend\dist\                            (build más reciente)
#   - BAT files: staging\*.bat
#
# Requiere: Inno Setup 6  (https://jrsoftware.org/isdl.php)
# Uso desde PowerShell:  cd C:\sites\pos_multitenant_local\installer
#                        .\build-exe.ps1
# =============================================================================

param(
    [string]$Version       = "1.1.0",
    [string]$OutputDir     = "output",
    [string]$InnoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    [string]$RuntimeSource = "v1.0.0"     # Carpeta de output que tiene los runtimes
)

$ErrorActionPreference = "Stop"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir   # Raíz del proyecto

# Logging helpers
function Write-Step { param([string]$msg) Write-Host "`n[>>>] $msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Write-Info { param([string]$msg) Write-Host "       $msg" -ForegroundColor Gray }
function Write-Fail { param([string]$msg) Write-Host "  [XX] $msg" -ForegroundColor Red; exit 1 }

# Banner
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   POS-iaDoS - Build EXE Installer            ║" -ForegroundColor Cyan
Write-Host "  ║   Versión: $Version                              ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# =============================================================================
# 1. Build frontend
# =============================================================================
Write-Step "Compilando frontend (npm run build)..."

$FrontendSrcDir = Join-Path $ProjectDir "frontend"
if (-not (Test-Path "$FrontendSrcDir\package.json")) {
    Write-Fail "No se encontró frontend en: $FrontendSrcDir"
}

$env:VITE_API_URL = ""
$buildResult = & cmd /c "cd /d `"$FrontendSrcDir`" && npm run build 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host $buildResult
    Write-Fail "npm run build falló (código: $LASTEXITCODE)"
}
Write-OK "Frontend compilado correctamente"

# =============================================================================
# 2. Generar icono ICO desde logo-iados.png
# =============================================================================
Write-Step "Generando icono pos-iados.ico..."

$LogoPng  = Join-Path $ProjectDir "frontend\public\logo-iados.png"
$IcoOut   = Join-Path $ScriptDir "assets\pos-iados.ico"

if (Test-Path $LogoPng) {
    try {
        Add-Type -AssemblyName System.Drawing

        $sizes = @(16, 32, 48, 256)
        $images = @()
        $pngDataList = @()

        $src = [System.Drawing.Bitmap]::FromFile($LogoPng)

        foreach ($size in $sizes) {
            $bmp = New-Object System.Drawing.Bitmap($size, $size)
            $g   = [System.Drawing.Graphics]::FromImage($bmp)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.DrawImage($src, 0, 0, $size, $size)
            $g.Dispose()

            $ms = New-Object System.IO.MemoryStream
            $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $pngDataList += ,($ms.ToArray())
            $ms.Dispose()
            $bmp.Dispose()
        }
        $src.Dispose()

        # Escribir ICO con múltiples tamaños (formato moderno con PNG embebido)
        $icoStream = New-Object System.IO.FileStream($IcoOut, [System.IO.FileMode]::Create)
        $w = New-Object System.IO.BinaryWriter($icoStream)

        $count  = $sizes.Count
        $offset = 6 + $count * 16   # header(6) + dirEntries(16 cada uno)

        # ICO header
        $w.Write([uint16]0)      # Reserved
        $w.Write([uint16]1)      # Type: ICO
        $w.Write([uint16]$count)

        # Directory entries
        for ($i = 0; $i -lt $count; $i++) {
            $sz  = $sizes[$i]
            $len = $pngDataList[$i].Length
            $w.Write([byte]$(if ($sz -eq 256) { 0 } else { $sz }))  # width
            $w.Write([byte]$(if ($sz -eq 256) { 0 } else { $sz }))  # height
            $w.Write([byte]0)       # color count
            $w.Write([byte]0)       # reserved
            $w.Write([uint16]1)     # planes
            $w.Write([uint16]32)    # bpp
            $w.Write([uint32]$len)
            $w.Write([uint32]$offset)
            $offset += $len
        }

        # Image data
        foreach ($png in $pngDataList) { $w.Write($png) }

        $w.Close()
        $icoStream.Close()
        Write-OK "Icono generado: assets\pos-iados.ico ($($sizes -join 'x, ')px)"
    } catch {
        Write-Warn "No se pudo generar el ICO: $_"
        Write-Info "El EXE se generará sin icono personalizado en el acceso directo"
    }
} else {
    Write-Warn "No se encontró logo-iados.png en frontend\public\"
    Write-Info "El EXE se generará sin icono personalizado en el acceso directo"
}

# =============================================================================
# 3. Verificar prerrequisitos
# =============================================================================
Write-Step "Verificando prerrequisitos..."

if (-not (Test-Path $InnoSetupPath)) {
    Write-Host "  [XX] Inno Setup 6 no encontrado en:" -ForegroundColor Red
    Write-Host "       $InnoSetupPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Descárgalo GRATIS en: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
    Write-Host "  Instálalo y vuelve a ejecutar este script." -ForegroundColor Yellow
    exit 1
}
Write-OK "Inno Setup 6 encontrado"

$RuntimeDir = Join-Path $ScriptDir "$OutputDir\POS-iaDoS-Setup-$RuntimeSource\runtime"
if (-not (Test-Path $RuntimeDir)) {
    Write-Host "  [XX] No se encontró carpeta de runtimes:" -ForegroundColor Red
    Write-Host "       $RuntimeDir" -ForegroundColor Red
    exit 1
}
Write-OK "Runtimes encontrados en: POS-iaDoS-Setup-$RuntimeSource\runtime"

$StagingDir  = Join-Path $ScriptDir "staging"
$FrontendDir = Join-Path $ProjectDir "frontend\dist"

if (-not (Test-Path $StagingDir)) {
    Write-Host "  [XX] Carpeta staging no encontrada: $StagingDir" -ForegroundColor Red
    exit 1
}
Write-OK "Staging encontrado"

if (-not (Test-Path $FrontendDir)) {
    Write-Warn "frontend\dist\ no encontrado - se usará el frontend de staging"
    Write-Info "Para incluir el frontend más reciente, ejecuta primero:"
    Write-Info "  cd ..\frontend && npm run build"
    $FrontendDir = $null
}
else {
    Write-OK "Frontend dist encontrado (build más reciente)"
}

$issFile = Join-Path $ScriptDir "setup.iss"
if (-not (Test-Path $issFile)) {
    Write-Host "  [XX] setup.iss no encontrado: $issFile" -ForegroundColor Red
    exit 1
}
Write-OK "setup.iss encontrado"

# =============================================================================
# 2. Crear carpeta merged v1.1.0
# =============================================================================
Write-Step "Creando paquete merged POS-iaDoS-v$Version..."

$MergedDir = Join-Path $ScriptDir "$OutputDir\POS-iaDoS-v$Version"

if (Test-Path $MergedDir) {
    Write-Warn "Eliminando carpeta previa..."
    Remove-Item -Recurse -Force $MergedDir
}
New-Item -ItemType Directory -Path $MergedDir | Out-Null
Write-OK "Carpeta creada: output\POS-iaDoS-v$Version"

# Subdirectorios necesarios
@("app", "app\backend", "app\database", "runtime", "setup", "logs") | ForEach-Object {
    New-Item -ItemType Directory -Path "$MergedDir\$_" -Force | Out-Null
}

# --- Paso 1: Copiar runtimes de v1.0.0 (node, mariadb, nssm) ---
Write-Info "Copiando runtimes (Node.js + MariaDB + NSSM)..."
Copy-Item -Path "$RuntimeDir\*" -Destination "$MergedDir\runtime" -Recurse -Force
Write-OK "Runtimes copiados"

# --- Paso 2: Copiar app desde staging ---
Write-Info "Copiando app desde staging..."
Copy-Item -Path "$StagingDir\app\*" -Destination "$MergedDir\app" -Recurse -Force
Write-OK "App copiada desde staging"

# --- Paso 3: Copiar frontend dist más reciente (si existe) ---
if ($FrontendDir -and (Test-Path $FrontendDir)) {
    Write-Info "Actualizando frontend con build más reciente..."
    $pubDir = "$MergedDir\app\backend\public"
    if (Test-Path $pubDir) {
        Remove-Item -Recurse -Force $pubDir
    }
    New-Item -ItemType Directory -Path $pubDir | Out-Null
    Copy-Item -Path "$FrontendDir\*" -Destination $pubDir -Recurse -Force
    Write-OK "Frontend actualizado desde frontend\dist"
}

# --- Paso 4: Copiar setup scripts desde staging ---
Write-Info "Copiando scripts de setup..."
Copy-Item -Path "$StagingDir\setup\*" -Destination "$MergedDir\setup" -Recurse -Force
Write-OK "Scripts de setup copiados"

# --- Paso 5: Copiar BAT files desde staging ---
Write-Info "Copiando archivos BAT..."
Get-ChildItem -Path $StagingDir -Filter "*.bat" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $MergedDir -Force
}
Copy-Item -Path "$StagingDir\LICENSE.txt" -Destination $MergedDir -Force -ErrorAction SilentlyContinue
Write-OK "Archivos BAT copiados"

# =============================================================================
# 3. Verificar integridad del paquete
# =============================================================================
Write-Step "Verificando integridad del paquete..."

$checks = @(
    @{ Path = "$MergedDir\runtime\node";              Name = "Node.js runtime" },
    @{ Path = "$MergedDir\runtime\mariadb";           Name = "MariaDB runtime" },
    @{ Path = "$MergedDir\runtime\nssm.exe";          Name = "NSSM" },
    @{ Path = "$MergedDir\app\backend\package.json";  Name = "Backend" },
    @{ Path = "$MergedDir\app\backend\public";        Name = "Frontend (public)" },
    @{ Path = "$MergedDir\setup\install.ps1";         Name = "install.ps1" },
    @{ Path = "$MergedDir\setup\uninstall.ps1";       Name = "uninstall.ps1" },
    @{ Path = "$MergedDir\INSTALAR.bat";              Name = "INSTALAR.bat" }
)

$allOk = $true
foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-OK $check.Name
    }
    else {
        Write-Host "  [!!] FALTA: $($check.Name)" -ForegroundColor Yellow
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host ""
    Write-Warn "Algunos componentes no se encontraron. El instalador podría estar incompleto."
    $resp = Read-Host "  ¿Continuar de todas formas? (s/N)"
    if ($resp -notmatch "^[sS]") { exit 1 }
}

# =============================================================================
# 4. Actualizar version.json
# =============================================================================
Write-Step "Actualizando version.json..."

$buildDate   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$versionJson = [ordered]@{
    version    = $Version
    build_date = $buildDate
    product    = "POS-iaDoS"
    company    = "iaDoS"
} | ConvertTo-Json -Depth 2

Set-Content -Path "$MergedDir\version.json" -Value $versionJson -Encoding UTF8
Write-OK "version.json: v$Version  ($buildDate)"

# =============================================================================
# 5. Actualizar títulos en BAT files
# =============================================================================
Write-Step "Actualizando versión en BAT files..."

Get-ChildItem -Path $MergedDir -Filter "*.bat" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content) {
        $content = $content -replace 'v\d+\.\d+\.\d+', "v$Version"
        Set-Content -Path $_.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-OK "$($_.Name)"
    }
}

# =============================================================================
# 6. Compilar EXE con Inno Setup
# =============================================================================
Write-Step "Compilando instalador EXE con Inno Setup 6..."
Write-Info "Compresión lzma2/ultra64 - esto puede tardar 3-8 minutos..."
Write-Host ""

$startTime = Get-Date

$process = Start-Process -FilePath $InnoSetupPath `
    -ArgumentList "`"$issFile`"" `
    -WorkingDirectory $ScriptDir `
    -PassThru `
    -Wait `
    -NoNewWindow

$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 0)

if ($process.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "  [XX] Inno Setup falló (código: $($process.ExitCode))" -ForegroundColor Red
    Write-Host "  Revisa los mensajes de error arriba." -ForegroundColor Yellow
    exit 1
}

# =============================================================================
# 7. Verificar y mostrar resultado
# =============================================================================
$exePath = Join-Path $ScriptDir "$OutputDir\POS-iaDoS-Setup-v$Version.exe"

if (-not (Test-Path $exePath)) {
    Write-Host "  [XX] El EXE no fue generado. Revisa setup.iss" -ForegroundColor Red
    exit 1
}

$sizeMB = [math]::Round((Get-Item $exePath).Length / 1MB, 1)

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║   BUILD COMPLETADO EXITOSAMENTE              ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  EXE generado:" -ForegroundColor White
Write-Host "    $exePath" -ForegroundColor Cyan
Write-Host "    Tamaño: ${sizeMB} MB  |  Tiempo: ${elapsed}s" -ForegroundColor Gray
Write-Host ""
Write-Host "  Contenido del instalador:" -ForegroundColor White
Write-Host "    • Runtime:   Node.js + MariaDB + NSSM" -ForegroundColor Gray
Write-Host "    • App:       Backend NestJS + Frontend React" -ForegroundColor Gray
Write-Host "    • Frontend:  v$Version (ícono SVG + tema Claro + iados.mx link)" -ForegroundColor Gray
Write-Host "    • Wizard:    Instalador profesional Windows" -ForegroundColor Gray
Write-Host ""
Write-Host "  Próximos pasos:" -ForegroundColor White
Write-Host "    1. Probar el EXE en una máquina limpia" -ForegroundColor Yellow
Write-Host "    2. Commit:  git add -A && git commit -m 'release: v$Version'" -ForegroundColor Yellow
Write-Host "    3. Tag:     git tag v$Version" -ForegroundColor Yellow
Write-Host ""
