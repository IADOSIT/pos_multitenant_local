# =============================================================================
# POS-iaDoS - Desinstalador
# =============================================================================
param(
    [string]$InstallDir = "C:\POS-iaDoS"
)

$ErrorActionPreference = "SilentlyContinue"
$NSSM = "$InstallDir\tools\nssm.exe"

Write-Host ""
Write-Host "  Desinstalando POS-iaDoS..." -ForegroundColor Yellow
Write-Host ""

# Detener y remover servicios
Write-Host "  [1/4] Deteniendo servicios..." -ForegroundColor Yellow
if (Test-Path $NSSM) {
    & $NSSM stop "PosIaDos-Backend" 2>&1 | Out-Null
    & $NSSM stop "PosIaDos-MariaDB" 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    & $NSSM remove "PosIaDos-Backend" confirm 2>&1 | Out-Null
    & $NSSM remove "PosIaDos-MariaDB" confirm 2>&1 | Out-Null
} else {
    # Fallback con sc
    sc.exe stop "PosIaDos-Backend" 2>&1 | Out-Null
    sc.exe stop "PosIaDos-MariaDB" 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    sc.exe delete "PosIaDos-Backend" 2>&1 | Out-Null
    sc.exe delete "PosIaDos-MariaDB" 2>&1 | Out-Null
}
Write-Host "  Servicios removidos" -ForegroundColor Green

# Remover reglas de firewall
Write-Host "  [2/4] Removiendo reglas de firewall..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="POS-iaDoS Backend" 2>&1 | Out-Null
netsh advfirewall firewall delete rule name="POS-iaDoS MariaDB" 2>&1 | Out-Null
Write-Host "  Firewall limpiado" -ForegroundColor Green

# Matar procesos residuales
Write-Host "  [3/4] Terminando procesos residuales..." -ForegroundColor Yellow
Get-Process -Name "mysqld" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "$InstallDir*"
} | Stop-Process -Force 2>&1
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "$InstallDir*"
} | Stop-Process -Force 2>&1
Start-Sleep -Seconds 2
Write-Host "  Procesos terminados" -ForegroundColor Green

# Eliminar directorio de instalacion
Write-Host "  [4/4] Eliminando archivos..." -ForegroundColor Yellow
if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force 2>&1
    if (Test-Path $InstallDir) {
        Write-Host "  ADVERTENCIA: Algunos archivos no pudieron eliminarse." -ForegroundColor Yellow
        Write-Host "  Elimine manualmente: $InstallDir" -ForegroundColor Yellow
    } else {
        Write-Host "  Archivos eliminados" -ForegroundColor Green
    }
} else {
    Write-Host "  No se encontro directorio de instalacion" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   POS-iaDoS desinstalado completamente" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
