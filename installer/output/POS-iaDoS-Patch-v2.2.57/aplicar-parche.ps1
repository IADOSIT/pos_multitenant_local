param([string]$InstallDir = "C:\POS-iaDoS")
$ErrorActionPreference = "Stop"
$NSSM  = "$InstallDir\tools\nssm.exe"
$SVC   = "PosIaDos-Backend"
$PATCH = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  POS-iaDoS Parche v2.2.57" -ForegroundColor Cyan
Write-Host "  Fix: selector de categoria en Productos + reinicio de servicio" -ForegroundColor Gray
Write-Host ""

# Verificar directorio de instalacion
if (-not (Test-Path $InstallDir)) {
    Write-Host "  ERROR: No se encontro la instalacion en $InstallDir" -ForegroundColor Red
    Write-Host "  Usa: .\aplicar-parche.ps1 -InstallDir 'C:\ruta\POS-iaDoS'" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $NSSM)) {
    Write-Host "  ERROR: No se encontro nssm.exe en $NSSM" -ForegroundColor Red
    exit 1
}

# ---- Detener servicio ----
Write-Host "  [1/5] Deteniendo servicio $SVC..." -ForegroundColor Yellow
try {
    $status = & $NSSM status $SVC 2>&1
    if ($status -match "SERVICE_RUNNING") {
        & $NSSM stop $SVC confirm 2>&1 | Out-Null
    }
} catch {}

# Esperar hasta que el servicio pare (max 30s)
$stopped = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep 3
    try {
        $s = & $NSSM status $SVC 2>&1
        if ($s -notmatch "SERVICE_RUNNING") { $stopped = $true; break }
    } catch { $stopped = $true; break }
}
if ($stopped) {
    Write-Host "    OK: Servicio detenido" -ForegroundColor Green
} else {
    Write-Host "    ADVERTENCIA: El servicio puede seguir corriendo, intentando continuar..." -ForegroundColor Yellow
}

# ---- Actualizar .env ----
Write-Host "  [2/5] Actualizando version en .env..." -ForegroundColor Yellow
$envFile = "$InstallDir\backend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match 'APP_VERSION=') {
        $envContent = $envContent -replace 'APP_VERSION=.*', 'APP_VERSION=2.2.57'
    } else {
        $envContent = $envContent.TrimEnd() + "`nAPP_VERSION=2.2.57`n"
    }
    $envContent | Set-Content $envFile -Encoding UTF8 -NoNewline
    Write-Host "    OK: APP_VERSION=2.2.57" -ForegroundColor Green
} else {
    Write-Host "    ADVERTENCIA: .env no encontrado en $envFile" -ForegroundColor Yellow
}

# ---- Aplicar archivos ----
Write-Host "  [3/5] Aplicando archivos..." -ForegroundColor Yellow
$changed = @("backend/dist", "backend/public")
foreach ($item in $changed) {
    $src  = "$PATCH\$item"
    $dest = "$InstallDir\$item"
    if (Test-Path $src) {
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
        Copy-Item -Path $src -Destination $dest -Recurse -Force
        Write-Host "    OK: $item" -ForegroundColor Green
    } else {
        Write-Host "    SKIP: $item (no incluido en este parche)" -ForegroundColor Gray
    }
}

# ---- Actualizar version.json ----
Write-Host "  [4/5] Actualizando version.json..." -ForegroundColor Yellow
$vjFile = "$InstallDir\version.json"
if (Test-Path $vjFile) {
    $vj = Get-Content $vjFile -Raw | ConvertFrom-Json
    $vj.version = "2.2.57"
    $vj | ConvertTo-Json | Set-Content $vjFile -Encoding UTF8
    Write-Host "    OK: version.json -> 2.2.57" -ForegroundColor Green
} else {
    # Crear version.json si no existe
    @{ version = "2.2.57"; product = "POS-iaDoS"; company = "iaDoS"; mode = "local" } | ConvertTo-Json | Set-Content $vjFile -Encoding UTF8
    Write-Host "    OK: version.json creado -> 2.2.57" -ForegroundColor Green
}

# ---- Reiniciar servicio ----
Write-Host "  [5/5] Reiniciando servicio $SVC..." -ForegroundColor Yellow
try {
    & $NSSM start $SVC 2>&1 | Out-Null
} catch {}

# Esperar que el backend levante (max 60s)
$ok = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep 3
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 3000)
        $tcp.Close()
        $ok = $true
        break
    } catch {}
}

Write-Host ""
if ($ok) {
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host "   PARCHE v2.2.57 APLICADO CORRECTAMENTE" -ForegroundColor Green
    Write-Host "   Backend respondiendo en localhost:3000" -ForegroundColor Green
    Write-Host "  ============================================" -ForegroundColor Green
} else {
    Write-Host "  ============================================" -ForegroundColor Yellow
    Write-Host "   PARCHE APLICADO - Backend no respondio aun" -ForegroundColor Yellow
    Write-Host "   Espera unos segundos y recarga el navegador" -ForegroundColor Yellow
    Write-Host "  ============================================" -ForegroundColor Yellow
}
Write-Host ""
