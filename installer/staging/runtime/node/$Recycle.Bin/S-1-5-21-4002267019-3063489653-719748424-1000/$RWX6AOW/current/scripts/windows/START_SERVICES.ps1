# ============================================================
# EMC Abastos - Levantar Servicios Post-Reinicio
# Ejecutar como Administrador
# ============================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " EMC Abastos - Iniciando Servicios" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecuta como Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Ejecutar como Administrador" -ForegroundColor Red
    Write-Host "Click derecho > Ejecutar como administrador" -ForegroundColor Yellow
    pause
    exit 1
}

# ============================================================
# 1. PostgreSQL
# ============================================================
Write-Host "[1/4] Iniciando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -ne "Running") {
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
    }
    $pgService = Get-Service -Name "postgresql*"
    if ($pgService.Status -eq "Running") {
        Write-Host "  PostgreSQL: RUNNING" -ForegroundColor Green
    } else {
        Write-Host "  PostgreSQL: FAILED" -ForegroundColor Red
    }
} else {
    Write-Host "  PostgreSQL: No encontrado (verificar nombre del servicio)" -ForegroundColor Yellow
}

# ============================================================
# 2. IIS (World Wide Web Publishing Service)
# ============================================================
Write-Host "[2/4] Iniciando IIS..." -ForegroundColor Yellow
$iisService = Get-Service -Name "W3SVC" -ErrorAction SilentlyContinue
if ($iisService) {
    if ($iisService.Status -ne "Running") {
        Start-Service "W3SVC"
        Start-Sleep -Seconds 2
    }
    $iisService = Get-Service -Name "W3SVC"
    if ($iisService.Status -eq "Running") {
        Write-Host "  IIS (W3SVC): RUNNING" -ForegroundColor Green
    } else {
        Write-Host "  IIS (W3SVC): FAILED" -ForegroundColor Red
    }
} else {
    Write-Host "  IIS: No instalado" -ForegroundColor Yellow
}

# ============================================================
# 3. Windows Process Activation Service (WAS) - Requerido por IIS
# ============================================================
Write-Host "[3/4] Verificando WAS..." -ForegroundColor Yellow
$wasService = Get-Service -Name "WAS" -ErrorAction SilentlyContinue
if ($wasService) {
    if ($wasService.Status -ne "Running") {
        Start-Service "WAS"
        Start-Sleep -Seconds 2
    }
    $wasService = Get-Service -Name "WAS"
    if ($wasService.Status -eq "Running") {
        Write-Host "  WAS: RUNNING" -ForegroundColor Green
    } else {
        Write-Host "  WAS: FAILED" -ForegroundColor Red
    }
} else {
    Write-Host "  WAS: No encontrado" -ForegroundColor Yellow
}

# ============================================================
# 4. Verificar PHP y Laravel
# ============================================================
Write-Host "[4/4] Verificando PHP y Laravel..." -ForegroundColor Yellow
$phpPath = "C:\php\php.exe"
$artisanPath = "C:\sites\emc_abastos\current\artisan"

if (Test-Path $phpPath) {
    Write-Host "  PHP: OK ($phpPath)" -ForegroundColor Green

    # Verificar Laravel
    if (Test-Path $artisanPath) {
        Write-Host "  Laravel: OK" -ForegroundColor Green

        # Limpiar caches
        Write-Host "  Limpiando caches..." -ForegroundColor Gray
        & $phpPath $artisanPath cache:clear 2>$null | Out-Null
        & $phpPath $artisanPath config:cache 2>$null | Out-Null
        & $phpPath $artisanPath route:cache 2>$null | Out-Null
        Write-Host "  Caches: OK" -ForegroundColor Green
    } else {
        Write-Host "  Laravel: No encontrado en $artisanPath" -ForegroundColor Red
    }
} else {
    Write-Host "  PHP: No encontrado en $phpPath" -ForegroundColor Red
}

# ============================================================
# Verificar Storage Link
# ============================================================
$storageLinkPath = "C:\sites\emc_abastos\current\public\storage"
if (-not (Test-Path $storageLinkPath)) {
    Write-Host "  Creando storage link..." -ForegroundColor Yellow
    & $phpPath $artisanPath storage:link 2>$null | Out-Null
}

# ============================================================
# Resumen Final
# ============================================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " RESUMEN DE SERVICIOS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$services = @(
    @{Name="postgresql*"; Display="PostgreSQL"},
    @{Name="W3SVC"; Display="IIS"},
    @{Name="WAS"; Display="WAS"}
)

foreach ($svc in $services) {
    $service = Get-Service -Name $svc.Name -ErrorAction SilentlyContinue
    if ($service) {
        $status = $service.Status
        $color = if ($status -eq "Running") { "Green" } else { "Red" }
        Write-Host ("  {0,-15} : {1}" -f $svc.Display, $status) -ForegroundColor $color
    } else {
        Write-Host ("  {0,-15} : No encontrado" -f $svc.Display) -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "URLs:" -ForegroundColor White
Write-Host "  Portal:     https://emc-abastos.mx" -ForegroundColor Gray
Write-Host "  Admin:      https://emc-abastos.mx/admin" -ForegroundColor Gray
Write-Host "  Tienda:     https://emc-abastos.mx/t/{handle}" -ForegroundColor Gray
Write-Host ""
Write-Host "Servicios listos!" -ForegroundColor Green
Write-Host ""
pause
