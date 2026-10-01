# =============================================================================
# POS-iaDoS - Gestión de Servicios
# =============================================================================
param(
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action = "status",
    [string]$InstallDir = "C:\POS-iaDoS"
)

$ErrorActionPreference = "SilentlyContinue"
$NSSM = "$InstallDir\tools\nssm.exe"
$services = @("PosIaDos-MariaDB", "PosIaDos-Backend")

# Puertos reales de este equipo. install.ps1 pudo haberlos movido (el backend
# a 3001-3040, MariaDB a 3307+) si los de fabrica estaban ocupados, y lo deja
# anotado en el .env. Leerlos de ahi evita reportar CERRADO un puerto que esta
# abierto y evita imprimir una URL que no abre.
$AppPort = 3000
$DbPort  = 3306
$envFile = Join-Path $InstallDir "backend\.env"
if (Test-Path $envFile) {
    foreach ($linea in (Get-Content $envFile -ErrorAction SilentlyContinue)) {
        if ($linea -match '^\s*APP_PORT\s*=\s*(\d+)') { $AppPort = [int]$Matches[1] }
        if ($linea -match '^\s*DB_PORT\s*=\s*(\d+)')  { $DbPort  = [int]$Matches[1] }
    }
}


function Get-ServiceStatus {
    param([string]$Name)
    try {
        $svc = Get-Service -Name $Name -ErrorAction Stop
        return $svc.Status
    } catch {
        return "No instalado"
    }
}

switch ($Action) {
    "start" {
        Write-Host "`n  Iniciando servicios POS-iaDoS...`n" -ForegroundColor Yellow
        foreach ($svc in $services) {
            Write-Host "  Iniciando $svc..." -ForegroundColor Gray
            & $NSSM start $svc 2>&1 | Out-Null
        }
        Start-Sleep -Seconds 3
        foreach ($svc in $services) {
            $status = Get-ServiceStatus $svc
            $color = if ($status -eq "Running") { "Green" } else { "Red" }
            Write-Host "  $svc : $status" -ForegroundColor $color
        }
        Write-Host "`n  Sistema disponible en http://localhost:${AppPort}`n" -ForegroundColor Green
    }
    "stop" {
        Write-Host "`n  Deteniendo servicios POS-iaDoS...`n" -ForegroundColor Yellow
        foreach ($svc in ($services | Sort-Object -Descending)) {
            Write-Host "  Deteniendo $svc..." -ForegroundColor Gray
            & $NSSM stop $svc 2>&1 | Out-Null
        }
        Start-Sleep -Seconds 2
        Write-Host "  Servicios detenidos`n" -ForegroundColor Green
    }
    "restart" {
        Write-Host "`n  Reiniciando servicios POS-iaDoS...`n" -ForegroundColor Yellow
        foreach ($svc in ($services | Sort-Object -Descending)) {
            & $NSSM stop $svc 2>&1 | Out-Null
        }
        Start-Sleep -Seconds 3
        foreach ($svc in $services) {
            & $NSSM start $svc 2>&1 | Out-Null
        }
        Start-Sleep -Seconds 3
        foreach ($svc in $services) {
            $status = Get-ServiceStatus $svc
            $color = if ($status -eq "Running") { "Green" } else { "Red" }
            Write-Host "  $svc : $status" -ForegroundColor $color
        }
        Write-Host ""
    }
    "status" {
        Write-Host ""
        Write-Host "  ============================================" -ForegroundColor Cyan
        Write-Host "   POS-iaDoS - Estado del Sistema" -ForegroundColor Cyan
        Write-Host "  ============================================" -ForegroundColor Cyan
        Write-Host ""

        if (Test-Path "$InstallDir\version.json") {
            $ver = (Get-Content "$InstallDir\version.json" -Encoding UTF8 | ConvertFrom-Json)
            Write-Host "  Version: $($ver.version)  (Build: $($ver.build_date))" -ForegroundColor White
        }

        Write-Host ""
        foreach ($svc in $services) {
            $status = Get-ServiceStatus $svc
            $color = if ($status -eq "Running") { "Green" } elseif ($status -eq "Stopped") { "Yellow" } else { "Red" }
            Write-Host "  $svc : $status" -ForegroundColor $color
        }

        # Verificar puertos
        Write-Host ""
        $ports = @(@{Name="MariaDB"; Port=$DbPort}, @{Name="Backend"; Port=$AppPort})
        foreach ($p in $ports) {
            try {
                $tcp = New-Object System.Net.Sockets.TcpClient
                $tcp.Connect("127.0.0.1", $p.Port)
                $tcp.Close()
                Write-Host "  Puerto $($p.Port) ($($p.Name)): ABIERTO" -ForegroundColor Green
            } catch {
                Write-Host "  Puerto $($p.Port) ($($p.Name)): CERRADO" -ForegroundColor Red
            }
        }

        Write-Host ""
        Write-Host "  URL: http://localhost:${AppPort}" -ForegroundColor White
        Write-Host "  Logs: $InstallDir\logs\" -ForegroundColor Gray
        Write-Host ""
    }
}
