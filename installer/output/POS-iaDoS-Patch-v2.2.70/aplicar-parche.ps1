param([string]$InstallDir = "C:\POS-iaDoS")
$ErrorActionPreference = "SilentlyContinue"
$NSSM  = "$InstallDir\tools\nssm.exe"
$SVC   = "PosIaDos-Backend"
$PATCH = Split-Path -Parent $MyInvocation.MyCommand.Path
$VER   = "2.2.70"

function Write-Step { param([string]$m) Write-Host "`n  $m" -ForegroundColor Cyan }
function Write-OK   { param([string]$m) Write-Host "    [OK] $m" -ForegroundColor Green }
function Write-Warn { param([string]$m) Write-Host "    [!!] $m" -ForegroundColor Yellow }
function Write-Fail { param([string]$m) Write-Host "    [XX] $m" -ForegroundColor Red; Read-Host "Presiona Enter para salir"; exit 1 }

Write-Host ""
Write-Host "  +==========================================+" -ForegroundColor Cyan
Write-Host "  |   POS-iaDoS - Parche v$VER              |" -ForegroundColor Cyan
Write-Host "  |   Actualizacion segura (sin borrar BD)   |" -ForegroundColor Cyan
Write-Host "  +==========================================+" -ForegroundColor Cyan
Write-Host ""

# ── Verificar directorio de instalacion ──────────────────────────────────────
if (-not (Test-Path "$InstallDir\backend\dist\main.js")) {
    Write-Fail "No se encontro instalacion en '$InstallDir'. Verifica la ruta."
}
Write-OK "Instalacion encontrada en $InstallDir"

# ── Detener servicio ──────────────────────────────────────────────────────────
Write-Step "Deteniendo servicio $SVC..."
& $NSSM stop $SVC 2>&1 | Out-Null
Start-Sleep -Seconds 4
Write-OK "Servicio detenido"

# ── Actualizar backend/dist (solo codigo compilado) ───────────────────────────
Write-Step "Actualizando backend (dist)..."
$srcDist  = "$PATCH\backend\dist"
$destDist = "$InstallDir\backend\dist"
if (-not (Test-Path $srcDist)) {
    Write-Fail "No se encontro backend\dist en el parche."
}
# Eliminar dist anterior respetando permisos
try {
    takeown /f $destDist /r /d s 2>&1 | Out-Null
    icacls $destDist /grant "Everyone:(OI)(CI)F" /t /q 2>&1 | Out-Null
    Remove-Item -Recurse -Force $destDist -ErrorAction Stop
} catch {
    Write-Warn "No se pudo eliminar dist anterior completamente — sobreescribiendo..."
}
Copy-Item -Path $srcDist -Destination $destDist -Recurse -Force
Write-OK "backend\dist actualizado"

# ── Actualizar frontend (backend/public) ──────────────────────────────────────
Write-Step "Actualizando frontend (public)..."
$srcPub  = "$PATCH\backend\public"
$destPub = "$InstallDir\backend\public"
if (Test-Path $srcPub) {
    try {
        takeown /f $destPub /r /d s 2>&1 | Out-Null
        icacls $destPub /grant "Everyone:(OI)(CI)F" /t /q 2>&1 | Out-Null
        Remove-Item -Recurse -Force $destPub -ErrorAction Stop
    } catch {
        Write-Warn "No se pudo eliminar public anterior — sobreescribiendo..."
    }
    Copy-Item -Path $srcPub -Destination $destPub -Recurse -Force
    Write-OK "backend\public (frontend) actualizado"
} else {
    Write-Warn "backend\public no incluido en este parche — omitiendo"
}

# ── Copiar PRIMER_USO.html (si existe) ───────────────────────────────────────
$primerUso = "$PATCH\PRIMER_USO.html"
if (Test-Path $primerUso) {
    Copy-Item -Path $primerUso -Destination "$InstallDir\PRIMER_USO.html" -Force
    Write-OK "PRIMER_USO.html actualizado"
}

# ── Actualizar APP_VERSION en .env (SIN tocar BD ni otras configs) ────────────
Write-Step "Actualizando version en .env..."
$envFile = "$InstallDir\backend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match 'APP_VERSION=') {
        $envContent = $envContent -replace 'APP_VERSION=[^\r\n]*', "APP_VERSION=$VER"
    } else {
        $envContent = $envContent.TrimEnd() + "`r`nAPP_VERSION=$VER`r`n"
    }
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8 -NoNewline
    Write-OK "APP_VERSION=$VER en .env"
} else {
    Write-Warn ".env no encontrado en $InstallDir\backend\"
}

# ── Actualizar version.json ───────────────────────────────────────────────────
$vjFile = "$InstallDir\version.json"
if (Test-Path $vjFile) {
    try {
        $vj = Get-Content $vjFile -Raw | ConvertFrom-Json
        $vj.version    = $VER
        $vj.build_date = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        $vj | ConvertTo-Json | Set-Content $vjFile -Encoding UTF8
        Write-OK "version.json -> $VER"
    } catch {
        Write-Warn "No se pudo actualizar version.json"
    }
}

# ── Reiniciar servicio ────────────────────────────────────────────────────────
Write-Step "Reiniciando servicio $SVC..."
& $NSSM start $SVC 2>&1 | Out-Null

Write-Host ""
Write-Host "  Esperando que el backend levante (max 90s)..." -ForegroundColor Yellow
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 3
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 3000)
        $tcp.Close()
        $ok = $true
        break
    } catch {}
    Write-Host "    ... $([int](($i+1)*3))s" -NoNewline -ForegroundColor DarkGray
    Write-Host "`r" -NoNewline
}

Write-Host ""
Write-Host ""
if ($ok) {
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host "  PARCHE v$VER APLICADO CORRECTAMENTE" -ForegroundColor Green
    Write-Host "  Backend activo en http://localhost:3000" -ForegroundColor Green
    Write-Host "  ============================================" -ForegroundColor Green
} else {
    Write-Host "  ============================================" -ForegroundColor Yellow
    Write-Host "  Parche aplicado pero el backend no respondio" -ForegroundColor Yellow
    Write-Host "  Verifica con: C:\POS-iaDoS\ESTADO.bat" -ForegroundColor Yellow
    Write-Host "  ============================================" -ForegroundColor Yellow
}
Write-Host ""
Read-Host "Presiona Enter para cerrar"
