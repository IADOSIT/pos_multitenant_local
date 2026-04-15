param([switch]$Registrar, [int]$CadaHoras = 1)
$ErrorActionPreference = "SilentlyContinue"

# Forzar UTF-8 para leer stdout de mysqldump correctamente (evita corrupción de ñ, é, etc.)
$prevOutputEncoding = [Console]::OutputEncoding
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$VPS_HOST = "74.208.149.7"; $VPS_PORT = "3306"; $VPS_USER = "root"
$VPS_PASS = "U191tl1ebFN2RJR0fld5QhC8U29AhdOQ"; $VPS_DB = "pos_iados"
$LOC_HOST = "localhost"; $LOC_PORT = "3306"; $LOC_USER = "pos_iados"
$LOC_PASS = "pos_iados_2024"; $LOC_DB = "pos_iados"

$DIR   = Split-Path -Parent $MyInvocation.MyCommand.Path
$SELF  = $MyInvocation.MyCommand.Path
$LOG   = "$DIR\logs\sync-vps.log"
$DUMP  = "$DIR\database\_vps_full_dump.sql"
$SEED  = "$DIR\database\04_seed_pruebas.sql"
$SEED2 = "$DIR\installer\staging\app\database\04_seed_pruebas.sql"

$TABLES_INSERT  = "tenants","empresas","tiendas","licencias","users","categorias","productos","producto_tienda","ticket_configs","cajas","gateway_configs","menu_digital_config","backup_configs","mesas","mesa_asignaciones","mesas_juntas"
$TABLES_TRUNC   = [array]::Reverse($TABLES_INSERT); $TABLES_TRUNC = $TABLES_INSERT | Select-Object -Last ($TABLES_INSERT.Count) | Sort-Object { [array]::IndexOf($TABLES_INSERT,$_) } -Descending

function wl($m,$c="White"){ $ts=Get-Date -Format "HH:mm:ss"; Write-Host "  [$ts] $m" -ForegroundColor $c; $d=Split-Path $LOG; if(!(Test-Path $d)){New-Item -ItemType Directory -Force -Path $d|Out-Null}; Add-Content $LOG "[$ts] $m" -ErrorAction SilentlyContinue }

function Find-Tool($n){
    $c=Get-Command $n -ErrorAction SilentlyContinue; if($c){return $c.Source}
    @("C:\tools\mysql\current\bin\$n.exe","C:\Program Files\MySQL\MySQL Server 8.4\bin\$n.exe","C:\Program Files\MySQL\MySQL Server 8.0\bin\$n.exe","C:\Program Files\MariaDB 10.11\bin\$n.exe","C:\POS-iaDoS\mariadb\bin\$n.exe","$DIR\installer\staging\runtime\mariadb\bin\$n.exe") | ForEach-Object { if(Test-Path $_){return $_} }
    return $null
}

if ($Registrar) {
    $act = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -NonInteractive -WindowStyle Hidden -File `"$SELF`""
    $tri = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Hours $CadaHoras) -Once -At (Get-Date)
    $set = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -StartWhenAvailable
    $pri = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
    Unregister-ScheduledTask -TaskName "POS-iaDoS Sync VPS" -Confirm:$false 2>&1|Out-Null
    Register-ScheduledTask -TaskName "POS-iaDoS Sync VPS" -TaskPath "\POS-iaDoS\" -Action $act -Trigger $tri -Settings $set -Principal $pri -Description "Sync VPS->local cada $CadaHoras hora(s)" -Force | Out-Null
    Write-Host "  Tarea programada registrada: cada $CadaHoras hora(s)" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host "   POS-iaDoS -- Sync VPS -> Local" -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host ""

$DUMP_EXE = Find-Tool "mysqldump"
$MYSQL_EXE = Find-Tool "mysql"
if (-not $DUMP_EXE -or -not $MYSQL_EXE) { wl "ERROR: No se encontro mysql/mysqldump en el PATH" "Red"; exit 1 }

wl "Paso 1/4: Verificando VPS..." "Yellow"
& $MYSQL_EXE -h $VPS_HOST -P $VPS_PORT -u $VPS_USER -p"$VPS_PASS" $VPS_DB -N -e "SELECT 1" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { wl "ERROR: No se puede conectar a VPS $VPS_HOST`:$VPS_PORT" "Red"; exit 1 }
wl "  VPS OK" "Green"

wl "Paso 2/4: Dumpeando VPS e importando a local..." "Yellow"
& $DUMP_EXE -h $VPS_HOST -P $VPS_PORT -u $VPS_USER -p"$VPS_PASS" --single-transaction --skip-lock-tables --add-drop-table --default-character-set=utf8mb4 $VPS_DB 2>$null | Set-Content -Path $DUMP -Encoding UTF8
if (-not (Test-Path $DUMP) -or (Get-Item $DUMP).Length -lt 10000) { wl "ERROR: Dump fallo o esta vacio" "Red"; exit 1 }
$sz = [math]::Round((Get-Item $DUMP).Length / 1MB, 2)
wl "  Dump: $sz MB -> importando a local..." "Gray"
Get-Content $DUMP -Raw | & $MYSQL_EXE -h $LOC_HOST -P $LOC_PORT -u $LOC_USER -p"$LOC_PASS" $LOC_DB 2>&1 | Out-Null
wl "  BD local actualizada OK" "Green"

wl "Paso 3/4: Generando seed para instalador EXE..." "Yellow"
$genDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("-- POS-iaDoS Seed -- exportado VPS $genDate")
$lines.Add("USE pos_iados;")
$lines.Add("SET SESSION check_constraint_checks=OFF;")
$lines.Add("SET FOREIGN_KEY_CHECKS=0;")
$lines.Add("SET NAMES utf8mb4;")
$lines.Add("")
$lines.Add("-- Limpiar (hijos primero)")
$rev = [System.Linq.Enumerable]::Reverse([string[]]$TABLES_INSERT)
foreach ($t in $rev) { $lines.Add("TRUNCATE TABLE $t;") }
$lines.Add("")
[System.IO.File]::WriteAllLines($SEED, $lines, [System.Text.UTF8Encoding]::new($false))

foreach ($t in $TABLES_INSERT) {
    $data = & $DUMP_EXE -h $VPS_HOST -P $VPS_PORT -u $VPS_USER -p"$VPS_PASS" --no-create-info --skip-triggers --compact --insert-ignore --single-transaction --skip-lock-tables --default-character-set=utf8mb4 $VPS_DB $t 2>$null
    if ($data) { [System.IO.File]::AppendAllLines($SEED, [string[]]$data, [System.Text.UTF8Encoding]::new($false)) }
}
# Agregar fixes automáticos al final del seed (se sobreescriben en cada sync)
$fixes = @(
    "",
    "-- ============================================================",
    "-- FIXES automáticos (no depender del install.ps1 para dev local)",
    "-- ============================================================",
    "",
    "-- FIX 1: Hashes verificados (admin123 / cajero123) para desarrollo local",
    "UPDATE users SET password='\$2a\$10\$rfhYzMwk8gXqxl6fXuycb.BK9EH85FOzVeroqJT62.r1gxW519R9.' WHERE rol IN ('superadmin','admin');",
    "UPDATE users SET password='\$2a\$10\$wLpX2XJG2vB9n5LD56Y45.cNIbK3mN3kqO6p69mYodxFAQkeXExk6' WHERE rol IN ('cajero','mesero','manager');",
    "",
    "-- FIX 2: producto_tienda -- vincular todos los productos activos de Mariscos 2-13's (empresa_id=4) a tienda 3",
    "INSERT IGNORE INTO ``producto_tienda`` (tenant_id, tienda_id, producto_id, precio_local, disponible, stock)",
    "  SELECT p.tenant_id, 3, p.id, NULL, 1, 0 FROM productos p WHERE p.empresa_id = 4 AND p.activo = 1;",
    "",
    "-- FIX 3: Imagen faltante para productos que usan imágenes subidas no disponibles localmente",
    "UPDATE productos SET imagen_url='/api/uploads/img/mariscos213s/aguachile-verde.jpeg' WHERE id=299 AND (imagen_url IS NULL OR imagen_url NOT LIKE '%mariscos213s%');",
    "",
    "-- FIX 4: modulo en categorias Regina — filtra que ve cada cajero/mesero en el POS",
    "UPDATE categorias SET modulo='carbon' WHERE id=19 AND tenant_id=6;",
    "UPDATE categorias SET modulo='hielo'  WHERE id=20 AND tenant_id=6;"
)
[System.IO.File]::AppendAllLines($SEED, [string[]]$fixes, [System.Text.UTF8Encoding]::new($false))

$seedKB = [math]::Round((Get-Item $SEED).Length / 1KB, 0)
wl "  Seed generado: $seedKB KB (con fixes automáticos)" "Green"

wl "Paso 4/4: Copiando seed a staging..." "Yellow"
if (Test-Path (Split-Path $SEED2)) { Copy-Item $SEED $SEED2 -Force; wl "  Copiado a staging OK" "Green" }
else { wl "  staging no encontrado (omitido)" "Yellow" }

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "   SYNC COMPLETADO" -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Green
$cT = & $MYSQL_EXE -h $LOC_HOST -P $LOC_PORT -u $LOC_USER -p"$LOC_PASS" $LOC_DB -N -e "SELECT COUNT(*) FROM tenants" 2>&1 | Where-Object { "$_" -match '^\d+$' } | Select-Object -Last 1
$cU = & $MYSQL_EXE -h $LOC_HOST -P $LOC_PORT -u $LOC_USER -p"$LOC_PASS" $LOC_DB -N -e "SELECT COUNT(*) FROM users"    2>&1 | Where-Object { "$_" -match '^\d+$' } | Select-Object -Last 1
$cP = & $MYSQL_EXE -h $LOC_HOST -P $LOC_PORT -u $LOC_USER -p"$LOC_PASS" $LOC_DB -N -e "SELECT COUNT(*) FROM productos" 2>&1 | Where-Object { "$_" -match '^\d+$' } | Select-Object -Last 1
Write-Host "  Tenants: $cT  |  Usuarios: $cU  |  Productos: $cP" -ForegroundColor Cyan
Write-Host "  Seed: $SEED" -ForegroundColor Gray
Write-Host ""
wl "Sync OK: T=$cT U=$cU P=$cP" "Green"

# Restaurar encoding
[Console]::OutputEncoding = $prevOutputEncoding
