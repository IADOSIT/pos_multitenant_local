param([string]$Version = "", [switch]$SoloBackend, [switch]$SoloFrontend)

$DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND  = "$DIR\backend"
$STAGING  = "$DIR\installer\staging\app\backend"
$OUT      = "$DIR\installer\output"

if (-not $Version) {
    $vj = Get-Content "$DIR\installer\staging\version.json" -Raw | ConvertFrom-Json
    $parts = $vj.version -split '\.'
    $Version = "$($parts[0]).$($parts[1]).$([int]$parts[2]+1)"
}

$PATCH_NAME = "POS-iaDoS-Patch-v$Version"
$PATCH_DIR  = "$OUT\$PATCH_NAME"
$PATCH_ZIP  = "$OUT\$PATCH_NAME.zip"

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host "   POS-iaDoS -- Generar Parche v$Version" -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $PATCH_DIR) { Remove-Item -Recurse -Force $PATCH_DIR }
New-Item -ItemType Directory -Force -Path "$PATCH_DIR\backend\dist" | Out-Null
New-Item -ItemType Directory -Force -Path "$PATCH_DIR\backend\public" | Out-Null

$changed = @()

# --- BACKEND: compilar TypeScript ---
if (-not $SoloFrontend) {
    Write-Host "  [1/3] Compilando TypeScript..." -ForegroundColor Yellow
    $distNew = "$STAGING\dist_new"
    $distFin = "$STAGING\dist"
    $r = & cmd /c "cd /d `"$BACKEND`" && npx tsc -p tsconfig.json --outDir `"$distNew`" --incremental false 2>&1"
    if (Test-Path "$distNew\main.js") {
        if (Test-Path $distFin) { Remove-Item -Recurse -Force $distFin }
        Rename-Item $distNew "dist"
        Copy-Item -Path "$distFin\*" -Destination "$PATCH_DIR\backend\dist" -Recurse -Force
        Write-Host "  [OK] Backend compilado" -ForegroundColor Green
        $changed += "backend/dist"
    } else {
        Write-Host "  [WARN] tsc fallo, usando dist anterior" -ForegroundColor Yellow
        Copy-Item -Path "$distFin\*" -Destination "$PATCH_DIR\backend\dist" -Recurse -Force
    }
}

# --- FRONTEND: build Vite ---
if (-not $SoloBackend) {
    Write-Host "  [2/3] Compilando frontend..." -ForegroundColor Yellow
    $distProd = "$DIR\frontend\dist-prod"
    if (Test-Path $distProd) { Remove-Item -Recurse -Force $distProd }
    $env:VITE_API_URL = "/api"
    & cmd /c "cd /d `"$DIR\frontend`" && npm run build 2>&1" | Out-Null
    if (Test-Path "$distProd\index.html") {
        Copy-Item -Path "$distProd\*" -Destination "$PATCH_DIR\backend\public" -Recurse -Force
        Write-Host "  [OK] Frontend compilado" -ForegroundColor Green
        $changed += "backend/public"
    } else {
        Write-Host "  [WARN] Frontend build fallo" -ForegroundColor Yellow
    }
}

# --- Script aplicar-parche ---
Write-Host "  [3/3] Empaquetando..." -ForegroundColor Yellow

$changedJson = ($changed | ForEach-Object { "`"$_`"" }) -join ","

$applyScript = @"
param([string]`$InstallDir = "C:\POS-iaDoS")
`$ErrorActionPreference = "SilentlyContinue"
`$NSSM = "`$InstallDir\tools\nssm.exe"
`$SVC  = "PosIaDos-Backend"
`$PATCH = Split-Path -Parent `$MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  POS-iaDoS Parche v$Version" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Deteniendo servicio..." -ForegroundColor Yellow
& `$NSSM stop `$SVC 2>&1 | Out-Null
Start-Sleep 3

Write-Host "  Aplicando archivos..." -ForegroundColor Yellow
`$changed = @($changedJson)
foreach (`$item in `$changed) {
    `$src  = "`$PATCH\`$item"
    `$dest = "`$InstallDir\`$item"
    if (Test-Path `$src) {
        if (Test-Path `$dest) { Remove-Item -Recurse -Force `$dest }
        New-Item -ItemType Directory -Force -Path (Split-Path `$dest) | Out-Null
        Copy-Item -Path `$src -Destination `$dest -Recurse -Force
        Write-Host "    OK: `$item" -ForegroundColor Green
    }
}

Write-Host "  Reiniciando servicio..." -ForegroundColor Yellow
& `$NSSM start `$SVC 2>&1 | Out-Null

Write-Host "  Esperando que el backend levante (max 60s)..." -ForegroundColor Yellow
`$ok = `$false
for (`$i = 0; `$i -lt 20; `$i++) {
    Start-Sleep 3
    try {
        `$tcp = New-Object System.Net.Sockets.TcpClient
        `$tcp.Connect("127.0.0.1", 3000)
        `$tcp.Close()
        `$ok = `$true
        break
    } catch {}
}
Write-Host ""
if (`$ok) {
    Write-Host "  PARCHE v$Version APLICADO Y BACKEND OK" -ForegroundColor Green
} else {
    Write-Host "  ADVERTENCIA: Backend no respondio en 60s. Revisa ESTADO.bat" -ForegroundColor Yellow
}
Write-Host ""
"@

$applyScript | Set-Content "$PATCH_DIR\aplicar-parche.ps1" -Encoding UTF8

@"
@echo off
echo Aplicando parche POS-iaDoS v$Version...
powershell -ExecutionPolicy Bypass -File "%~dp0aplicar-parche.ps1"
pause
"@ | Set-Content "$PATCH_DIR\APLICAR.bat"

# Actualizar version.json del parche
@{ version = $Version; patch_date = (Get-Date -Format "yyyy-MM-dd HH:mm:ss"); type = "patch" } |
    ConvertTo-Json | Set-Content "$PATCH_DIR\version.json"

# Crear ZIP
if (Test-Path $PATCH_ZIP) { Remove-Item $PATCH_ZIP -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($PATCH_DIR, $PATCH_ZIP)

$sizeMB = [math]::Round((Get-Item $PATCH_ZIP).Length / 1MB, 1)

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "   PARCHE GENERADO" -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "  ZIP:  $PATCH_ZIP" -ForegroundColor Cyan
Write-Host "  Size: $sizeMB MB  (vs ~85 MB del EXE)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Para aplicar en maquina cliente:" -ForegroundColor White
Write-Host "    1. Copiar $PATCH_NAME.zip al cliente" -ForegroundColor Gray
Write-Host "    2. Extraer y ejecutar APLICAR.bat como Admin" -ForegroundColor Gray
Write-Host ""
Write-Host "  Para aplicar AQUI mismo (EXE instalado en C:\POS-iaDoS):" -ForegroundColor White
Write-Host "    powershell -File `"$PATCH_DIR\aplicar-parche.ps1`"" -ForegroundColor Gray
Write-Host ""
