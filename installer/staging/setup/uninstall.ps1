# =============================================================================
# POS-iaDoS - Desinstalador
#
# POR DEFECTO NO BORRA DATOS.
#
# Antes este script hacia Remove-Item -Recurse -Force sobre toda la carpeta de
# instalacion, con mariadb\data dentro, sin preguntar y sin respaldo: un doble
# clic por error se llevaba el negocio completo. Ya no.
#
# Ahora:
#   .\uninstall.ps1                 quita servicios y firewall, DEJA los datos
#   .\uninstall.ps1 -BorrarTodo     respalda fuera de la carpeta y luego borra,
#                                   y exige que se escriba la frase completa
# =============================================================================
param(
    [string]$InstallDir = "C:\POS-iaDoS",
    [switch]$BorrarTodo,
    [switch]$SiSinPreguntar,
    [string]$DestinoRespaldoFinal = ""
)

$ErrorActionPreference = "SilentlyContinue"
$NSSM = "$InstallDir\tools\nssm.exe"

function Tamano-Legible {
    param([double]$Bytes)
    if ($Bytes -ge 1073741824) { return "{0:N2} GB" -f ($Bytes / 1073741824) }
    if ($Bytes -ge 1048576)    { return "{0:N1} MB" -f ($Bytes / 1048576) }
    return "{0:N0} KB" -f ($Bytes / 1024)
}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Yellow
Write-Host "   POS-iaDoS - Desinstalar" -ForegroundColor Yellow
Write-Host "  ============================================" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $InstallDir)) {
    Write-Host "  No se encontro $InstallDir. Nada que hacer." -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# --- Que hay en riesgo ---
$datosDir = "$InstallDir\mariadb\data"
$upDir    = "$InstallDir\backend\uploads"
$tamDatos = 0
$tamUp    = 0
$numUp    = 0
if (Test-Path $datosDir) {
    $tamDatos = (Get-ChildItem -Path $datosDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
}
if (Test-Path $upDir) {
    $arch  = Get-ChildItem -Path $upDir -Recurse -File -ErrorAction SilentlyContinue
    $numUp = $arch.Count
    $tamUp = ($arch | Measure-Object -Property Length -Sum).Sum
}

Write-Host "  En este equipo hay:" -ForegroundColor White
Write-Host "    Base de datos : $(Tamano-Legible $tamDatos)" -ForegroundColor Cyan
Write-Host "    Imagenes      : $numUp archivos, $(Tamano-Legible $tamUp)" -ForegroundColor Cyan
Write-Host ""

# =============================================================================
#  Confirmacion solo cuando se pidio borrar
# =============================================================================
if ($BorrarTodo) {
    Write-Host "  ATENCION: se pidio -BorrarTodo." -ForegroundColor Red
    Write-Host "  Esto elimina la base de datos y las imagenes del negocio." -ForegroundColor Red
    Write-Host "  Antes se hace un respaldo FUERA de la carpeta de instalacion." -ForegroundColor Yellow
    Write-Host ""
    if (-not $SiSinPreguntar) {
        $r = Read-Host "  Escribe exactamente: BORRAR TODO"
        if ($r -ne "BORRAR TODO") {
            Write-Host ""
            Write-Host "  Cancelado. No se borro nada." -ForegroundColor Green
            Write-Host ""
            exit 0
        }
    }
} else {
    Write-Host "  Se van a quitar los servicios de Windows y las reglas de" -ForegroundColor White
    Write-Host "  firewall. LOS DATOS SE QUEDAN en $InstallDir." -ForegroundColor Green
    Write-Host ""
    Write-Host "  Si lo que quieres es borrar tambien los datos, vuelve a" -ForegroundColor Gray
    Write-Host "  correrlo con -BorrarTodo." -ForegroundColor Gray
    Write-Host ""
}

# =============================================================================
#  1. Servicios
# =============================================================================
Write-Host "  [1/4] Deteniendo servicios..." -ForegroundColor Yellow
if (Test-Path $NSSM) {
    & $NSSM stop "PosIaDos-Backend" 2>&1 | Out-Null
    & $NSSM stop "PosIaDos-MariaDB" 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    & $NSSM remove "PosIaDos-Backend" confirm 2>&1 | Out-Null
    & $NSSM remove "PosIaDos-MariaDB" confirm 2>&1 | Out-Null
} else {
    sc.exe stop "PosIaDos-Backend" 2>&1 | Out-Null
    sc.exe stop "PosIaDos-MariaDB" 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    sc.exe delete "PosIaDos-Backend" 2>&1 | Out-Null
    sc.exe delete "PosIaDos-MariaDB" 2>&1 | Out-Null
}
Write-Host "  Servicios removidos" -ForegroundColor Green

# =============================================================================
#  2. Firewall
# =============================================================================
Write-Host "  [2/4] Removiendo reglas de firewall..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="POS-iaDoS Backend" 2>&1 | Out-Null
netsh advfirewall firewall delete rule name="POS-iaDoS MariaDB" 2>&1 | Out-Null
Write-Host "  Firewall limpiado" -ForegroundColor Green

# =============================================================================
#  3. Procesos
# =============================================================================
Write-Host "  [3/4] Terminando procesos residuales..." -ForegroundColor Yellow
Get-Process -Name "mysqld" -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -like "$InstallDir*" } | Stop-Process -Force 2>&1
Get-Process -Name "node" -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -like "$InstallDir*" } | Stop-Process -Force 2>&1
Start-Sleep -Seconds 2
Write-Host "  Procesos terminados" -ForegroundColor Green

# =============================================================================
#  4. Archivos
# =============================================================================
if (-not $BorrarTodo) {
    Write-Host "  [4/4] Archivos: SE DEJAN COMO ESTAN" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host "   POS-iaDoS desconectado de Windows" -ForegroundColor Green
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Los datos siguen intactos en:" -ForegroundColor White
    Write-Host "    $InstallDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Para volver a dejarlo operando, corre el instalador otra vez:" -ForegroundColor White
    Write-Host "  detecta la instalacion, respalda y la reconecta sin perder nada." -ForegroundColor White
    Write-Host ""
    Write-Host "  Para borrar los datos de verdad:" -ForegroundColor Gray
    Write-Host "    powershell -File tools\uninstall.ps1 -BorrarTodo" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# --- Respaldo final obligatorio, fuera de la carpeta que se va a borrar ---
Write-Host "  [4/4] Respaldo final antes de borrar..." -ForegroundColor Yellow

$sello = Get-Date -Format "yyyyMMdd-HHmmss"
if ($DestinoRespaldoFinal -ne "") {
    $destino = Join-Path $DestinoRespaldoFinal "POS-iaDoS-respaldo-final-$sello"
} else {
    $padre = Split-Path -Parent $InstallDir
    if (-not $padre) { $padre = "C:\" }
    $destino = Join-Path $padre "POS-iaDoS-respaldo-final-$sello"
}

$respaldarPs1 = "$InstallDir\tools\respaldar.ps1"
$respaldoOk = $false

if (Test-Path $respaldarPs1) {
    # Se vuelve a levantar MariaDB un momento: mysqldump la necesita viva y los
    # servicios ya se quitaron arriba.
    $mysqld = "$InstallDir\mariadb\bin\mysqld.exe"
    $proc = $null
    if (Test-Path $mysqld) {
        $proc = Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=`"$InstallDir\mariadb\my.ini`"" -WindowStyle Hidden -PassThru
        Start-Sleep -Seconds 12
    }
    $ErrorActionPreference = "Continue"
    & powershell -NoProfile -ExecutionPolicy Bypass -File $respaldarPs1 `
        -InstallDir $InstallDir -Etiqueta "final-antes-de-borrar" `
        -Destino $destino -NoDetenerServicio 2>&1 | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }
    $respaldoOk = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = "SilentlyContinue"
    if ($proc) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 3 }
}

if (-not $respaldoOk) {
    # No se pudo respaldar con herramientas. Antes de borrar se copian en crudo
    # los datos y las imagenes: un volcado .sql es mejor, pero una copia de los
    # archivos de InnoDB y de uploads es infinitamente mejor que nada.
    Write-Host "  No se pudo hacer el respaldo con herramientas." -ForegroundColor Yellow
    Write-Host "  Se copian los archivos en crudo a:" -ForegroundColor Yellow
    Write-Host "    $destino" -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    foreach ($par in @(
        @{ O = $datosDir;                     D = "mariadb-data" },
        @{ O = $upDir;                        D = "uploads" },
        @{ O = "$InstallDir\backend\.env";    D = "" },
        @{ O = "$InstallDir\version.json";    D = "" },
        @{ O = "$InstallDir\CREDENCIALES.txt"; D = "" },
        @{ O = "$InstallDir\backups";         D = "backups" }
    )) {
        if (-not (Test-Path $par.O)) { continue }
        if ($par.D -eq "") {
            Copy-Item -Path $par.O -Destination $destino -Force -ErrorAction SilentlyContinue
        } else {
            & robocopy $par.O (Join-Path $destino $par.D) /E /R:1 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
        }
    }
    $copiados = (Get-ChildItem -Path $destino -Recurse -File -ErrorAction SilentlyContinue)
    if ($copiados.Count -eq 0) {
        Write-Host ""
        Write-Host "  NO SE PUDO RESPALDAR NADA. NO SE BORRA." -ForegroundColor Red
        Write-Host "  Borrar sin respaldo no es una opcion. Revisa el equipo." -ForegroundColor Red
        Write-Host ""
        exit 1
    }
    Write-Host "  Copia en crudo: $($copiados.Count) archivos, $(Tamano-Legible (($copiados | Measure-Object -Property Length -Sum).Sum))" -ForegroundColor Green
} else {
    Write-Host "  Respaldo final listo en: $destino" -ForegroundColor Green
}

Write-Host "  Eliminando archivos de la instalacion..." -ForegroundColor Yellow
if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force 2>&1
    if (Test-Path $InstallDir) {
        Write-Host "  ADVERTENCIA: Algunos archivos no pudieron eliminarse." -ForegroundColor Yellow
        Write-Host "  Elimine manualmente: $InstallDir" -ForegroundColor Yellow
    } else {
        Write-Host "  Archivos eliminados" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   POS-iaDoS desinstalado" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  EL RESPALDO QUEDO AQUI. No lo borres:" -ForegroundColor Yellow
Write-Host "    $destino" -ForegroundColor Cyan
Write-Host ""
