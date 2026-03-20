param([string]$InstallDir = "C:\POS-iaDoS")
$ErrorActionPreference = "SilentlyContinue"
$NSSM = "$InstallDir\tools\nssm.exe"
$SVC  = "PosIaDos-Backend"
$PATCH = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  POS-iaDoS Parche v2.2.45" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Deteniendo servicio..." -ForegroundColor Yellow
& $NSSM stop $SVC 2>&1 | Out-Null
Start-Sleep 3

Write-Host "  Actualizando version en .env..." -ForegroundColor Yellow
$envFile = "$InstallDir\backend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match 'APP_VERSION=') {
        $envContent = $envContent -replace 'APP_VERSION=.*', 'APP_VERSION=2.2.45'
    } else {
        $envContent = $envContent.TrimEnd() + "
APP_VERSION=2.2.45
"
    }
    $envContent | Set-Content $envFile -Encoding UTF8 -NoNewline
    Write-Host "    OK: APP_VERSION=2.2.45 en .env" -ForegroundColor Green
}

Write-Host "  Aplicando archivos..." -ForegroundColor Yellow
$changed = @("backend/dist","backend/public")
foreach ($item in $changed) {
    $src  = "$PATCH\$item"
    $dest = "$InstallDir\$item"
    if (Test-Path $src) {
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
        Copy-Item -Path $src -Destination $dest -Recurse -Force
        Write-Host "    OK: $item" -ForegroundColor Green
    }
}

Write-Host "  Actualizando version.json..." -ForegroundColor Yellow
$vjFile = "$InstallDir\version.json"
if (Test-Path $vjFile) {
    $vj = Get-Content $vjFile -Raw | ConvertFrom-Json
    $vj.version = "2.2.45"
    $vj | ConvertTo-Json | Set-Content $vjFile -Encoding UTF8
    Write-Host "    OK: version.json -> 2.2.45" -ForegroundColor Green
}

Write-Host "  Reiniciando servicio..." -ForegroundColor Yellow
& $NSSM start $SVC 2>&1 | Out-Null

Write-Host "  Esperando que el backend levante (max 60s)..." -ForegroundColor Yellow
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
    Write-Host "  PARCHE v2.2.45 APLICADO Y BACKEND OK" -ForegroundColor Green
} else {
    Write-Host "  ADVERTENCIA: Backend no respondio en 60s. Revisa ESTADO.bat" -ForegroundColor Yellow
}
Write-Host ""
