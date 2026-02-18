# =============================================================================
# POS-iaDoS - Build del Instalador Offline v1.0.0
# Ejecutar desde: installer/
# Genera: installer/output/POS-iaDoS-Setup-v{VERSION}/
# =============================================================================
param(
    [switch]$SkipDownloads,
    [switch]$SkipCompile,
    [switch]$CreateZip
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot
$INSTALLER_DIR = $PSScriptRoot
$VERSION = (Get-Content "$INSTALLER_DIR\version.json" | ConvertFrom-Json).version
$OUTPUT = "$INSTALLER_DIR\output\POS-iaDoS-Setup-v$VERSION"
$DOWNLOADS = "$INSTALLER_DIR\.downloads"

# URLs de runtimes
$NODE_VERSION = "20.11.1"
$NODE_URL = "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-win-x64.zip"
$MARIADB_VERSION = "10.11.7"
$MARIADB_URL = "https://archive.mariadb.org/mariadb-$MARIADB_VERSION/winx64-packages/mariadb-$MARIADB_VERSION-winx64.zip"
$NSSM_VERSION = "2.24"
$NSSM_URL = "https://nssm.cc/release/nssm-$NSSM_VERSION.zip"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " POS-iaDoS Installer Build v$VERSION" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Crear directorios ---
New-Item -ItemType Directory -Force -Path $OUTPUT | Out-Null
New-Item -ItemType Directory -Force -Path $DOWNLOADS | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT\runtime\node" | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT\runtime\mariadb" | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT\app\backend" | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT\app\database" | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT\setup" | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT\logs" | Out-Null

# =============================================================================
# PASO 1: Descargar runtimes
# =============================================================================
if (-not $SkipDownloads) {
    Write-Host "[1/5] Descargando runtimes..." -ForegroundColor Yellow

    # Node.js
    $nodeZip = "$DOWNLOADS\node.zip"
    if (-not (Test-Path $nodeZip)) {
        Write-Host "  Descargando Node.js v$NODE_VERSION..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $NODE_URL -OutFile $nodeZip -UseBasicParsing
    } else {
        Write-Host "  Node.js ya descargado (cache)" -ForegroundColor Gray
    }

    # MariaDB
    $mariaZip = "$DOWNLOADS\mariadb.zip"
    if (-not (Test-Path $mariaZip)) {
        Write-Host "  Descargando MariaDB v$MARIADB_VERSION..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $MARIADB_URL -OutFile $mariaZip -UseBasicParsing
    } else {
        Write-Host "  MariaDB ya descargado (cache)" -ForegroundColor Gray
    }

    # nssm
    $nssmZip = "$DOWNLOADS\nssm.zip"
    if (-not (Test-Path $nssmZip)) {
        Write-Host "  Descargando nssm v$NSSM_VERSION..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $NSSM_URL -OutFile $nssmZip -UseBasicParsing
    } else {
        Write-Host "  nssm ya descargado (cache)" -ForegroundColor Gray
    }

    # Extraer Node.js
    Write-Host "  Extrayendo Node.js..." -ForegroundColor Gray
    $nodeTmp = "$DOWNLOADS\node-extracted"
    if (Test-Path $nodeTmp) { Remove-Item -Recurse -Force $nodeTmp }
    Expand-Archive -Path $nodeZip -DestinationPath $nodeTmp -Force
    $nodeDir = Get-ChildItem $nodeTmp | Select-Object -First 1
    Copy-Item -Path "$($nodeDir.FullName)\*" -Destination "$OUTPUT\runtime\node" -Recurse -Force

    # Extraer MariaDB
    Write-Host "  Extrayendo MariaDB..." -ForegroundColor Gray
    $mariaTmp = "$DOWNLOADS\mariadb-extracted"
    if (Test-Path $mariaTmp) { Remove-Item -Recurse -Force $mariaTmp }
    Expand-Archive -Path $mariaZip -DestinationPath $mariaTmp -Force
    $mariaDir = Get-ChildItem $mariaTmp | Select-Object -First 1
    Copy-Item -Path "$($mariaDir.FullName)\*" -Destination "$OUTPUT\runtime\mariadb" -Recurse -Force

    # Extraer nssm
    Write-Host "  Extrayendo nssm..." -ForegroundColor Gray
    $nssmTmp = "$DOWNLOADS\nssm-extracted"
    if (Test-Path $nssmTmp) { Remove-Item -Recurse -Force $nssmTmp }
    Expand-Archive -Path $nssmZip -DestinationPath $nssmTmp -Force
    $nssmExe = Get-ChildItem -Path $nssmTmp -Recurse -Filter "nssm.exe" | Where-Object { $_.Directory.Name -eq "win64" } | Select-Object -First 1
    Copy-Item -Path $nssmExe.FullName -Destination "$OUTPUT\runtime\nssm.exe" -Force

    Write-Host "  Runtimes listos" -ForegroundColor Green
} else {
    Write-Host "[1/5] Saltando descargas (--SkipDownloads)" -ForegroundColor DarkGray
}

# =============================================================================
# PASO 2: Compilar Backend
# =============================================================================
if (-not $SkipCompile) {
    Write-Host "[2/5] Compilando backend..." -ForegroundColor Yellow

    Push-Location "$ROOT\backend"

    # Instalar dependencias completas para compilar
    Write-Host "  npm install..." -ForegroundColor Gray
    & npm install --silent 2>&1 | Out-Null

    # Compilar TypeScript
    Write-Host "  npm run build..." -ForegroundColor Gray
    & npm run build 2>&1 | Out-Null

    if (-not (Test-Path "dist\main.js")) {
        Write-Host "  ERROR: No se genero dist/main.js" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    # Copiar dist
    Write-Host "  Copiando dist/..." -ForegroundColor Gray
    Copy-Item -Path "dist" -Destination "$OUTPUT\app\backend\dist" -Recurse -Force

    # Copiar package.json y package-lock.json
    Copy-Item -Path "package.json" -Destination "$OUTPUT\app\backend\" -Force
    Copy-Item -Path "package-lock.json" -Destination "$OUTPUT\app\backend\" -Force

    # Instalar solo dependencias de produccion
    Write-Host "  npm install --production..." -ForegroundColor Gray
    Push-Location "$OUTPUT\app\backend"
    & npm install --production --silent 2>&1 | Out-Null
    Pop-Location

    Pop-Location
    Write-Host "  Backend compilado" -ForegroundColor Green

    # =============================================================================
    # PASO 3: Compilar Frontend
    # =============================================================================
    Write-Host "[3/5] Compilando frontend..." -ForegroundColor Yellow

    Push-Location "$ROOT\frontend"

    Write-Host "  npm install..." -ForegroundColor Gray
    & npm install --silent 2>&1 | Out-Null

    # Build con base URL correcta para produccion
    Write-Host "  npm run build..." -ForegroundColor Gray
    $env:VITE_API_URL = "/api"
    & npm run build 2>&1 | Out-Null

    if (-not (Test-Path "dist\index.html")) {
        Write-Host "  ERROR: No se genero dist/index.html" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    # Copiar frontend build a backend/public
    Write-Host "  Copiando frontend a backend/public..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path "$OUTPUT\app\backend\public" | Out-Null
    Copy-Item -Path "dist\*" -Destination "$OUTPUT\app\backend\public" -Recurse -Force

    Pop-Location
    Write-Host "  Frontend compilado" -ForegroundColor Green
} else {
    Write-Host "[2/5] Saltando compilacion backend (--SkipCompile)" -ForegroundColor DarkGray
    Write-Host "[3/5] Saltando compilacion frontend (--SkipCompile)" -ForegroundColor DarkGray
}

# =============================================================================
# PASO 4: Copiar archivos de soporte
# =============================================================================
Write-Host "[4/5] Copiando archivos de soporte..." -ForegroundColor Yellow

# SQL seeds
Copy-Item -Path "$ROOT\database\*.sql" -Destination "$OUTPUT\app\database\" -Force

# Scripts de instalacion
Copy-Item -Path "$INSTALLER_DIR\scripts\*.ps1" -Destination "$OUTPUT\setup\" -Force

# BATs de entrada
Copy-Item -Path "$INSTALLER_DIR\INSTALAR.bat" -Destination "$OUTPUT\" -Force
Copy-Item -Path "$INSTALLER_DIR\DESINSTALAR.bat" -Destination "$OUTPUT\" -Force
Copy-Item -Path "$INSTALLER_DIR\ACTUALIZAR.bat" -Destination "$OUTPUT\" -Force

# Version y licencia
Copy-Item -Path "$INSTALLER_DIR\version.json" -Destination "$OUTPUT\" -Force
Copy-Item -Path "$INSTALLER_DIR\assets\license.txt" -Destination "$OUTPUT\LICENSE.txt" -Force

# Actualizar build_date en version.json del output
$versionData = Get-Content "$OUTPUT\version.json" | ConvertFrom-Json
$versionData.build_date = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
$versionData | ConvertTo-Json | Set-Content "$OUTPUT\version.json"

Write-Host "  Archivos copiados" -ForegroundColor Green

# =============================================================================
# PASO 5: Empaquetar ZIP (opcional)
# =============================================================================
if ($CreateZip) {
    Write-Host "[5/5] Creando ZIP..." -ForegroundColor Yellow
    $zipPath = "$INSTALLER_DIR\output\POS-iaDoS-Setup-v$VERSION.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path $OUTPUT -DestinationPath $zipPath -CompressionLevel Optimal
    $sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
    Write-Host "  ZIP creado: $zipPath ($sizeMB MB)" -ForegroundColor Green
} else {
    Write-Host "[5/5] ZIP no solicitado (usar -CreateZip)" -ForegroundColor DarkGray
}

# =============================================================================
# Resumen
# =============================================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " Build completado!" -ForegroundColor Green
Write-Host " Version: $VERSION" -ForegroundColor Green
Write-Host " Output:  $OUTPUT" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para instalar: copiar carpeta al equipo destino y ejecutar INSTALAR.bat" -ForegroundColor White
