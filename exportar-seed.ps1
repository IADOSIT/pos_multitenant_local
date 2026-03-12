# =============================================================================
# POS-iaDoS - Exportar Seed desde BD local
# Genera database/03_seed_datos_iniciales.sql listo para incluir en el EXE
#
# Uso: powershell -File exportar-seed.ps1
# =============================================================================

$ErrorActionPreference = "Stop"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- Config BD (leer de backend/.env o loc.env) ---
$EnvFile = Join-Path $ScriptDir "backend\.env"
if (-not (Test-Path $EnvFile)) { $EnvFile = Join-Path $ScriptDir "backend\loc.env" }

$DB_HOST = "localhost"
$DB_PORT = "3306"
$DB_USER = "pos_iados"
$DB_PASS = "pos_iados_2024"
$DB_NAME = "pos_iados"

if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^DB_HOST=(.+)')     { $DB_HOST = $Matches[1].Trim() }
        if ($_ -match '^DB_PORT=(.+)')     { $DB_PORT = $Matches[1].Trim() }
        if ($_ -match '^DB_USERNAME=(.+)') { $DB_USER = $Matches[1].Trim() }
        if ($_ -match '^DB_PASSWORD=(.+)') { $DB_PASS = $Matches[1].Trim() }
        if ($_ -match '^DB_NAME=(.+)')     { $DB_NAME = $Matches[1].Trim() }
    }
}

# --- Detectar mysqldump ---
$candidates = @(
    "C:\POS-iaDoS\mariadb\bin\mysqldump.exe",
    (Join-Path $ScriptDir "installer\output\POS-iaDoS-Setup-v1.1.0\runtime\mariadb\bin\mysqldump.exe"),
    "mysqldump"
)
$mysqldump = "mysqldump"
foreach ($c in $candidates) {
    if (Test-Path $c -ErrorAction SilentlyContinue) { $mysqldump = $c; break }
}

# --- Tablas a exportar (en orden correcto para FK) ---
$tablas = @(
    "tenants", "empresas", "tiendas", "licencias", "users",
    "ticket_configs", "categorias", "productos", "producto_tienda",
    "cajas", "menu_digital_config", "backup_configs"
)

$outFile = Join-Path $ScriptDir "database\03_seed_datos_iniciales.sql"
$version = "2.x.x"
# Intentar leer version actual
$verFiles = Get-ChildItem "$ScriptDir\installer\output\*-src\version.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if ($verFiles) {
    $vj = Get-Content $verFiles[0].FullName -Raw | ConvertFrom-Json
    $version = $vj.version
}

Write-Host ""
Write-Host "  POS-iaDoS - Exportar Seed" -ForegroundColor Cyan
Write-Host "  BD: $DB_HOST`:$DB_PORT/$DB_NAME" -ForegroundColor Gray
Write-Host "  Destino: $outFile" -ForegroundColor Gray
Write-Host ""

# --- Header del archivo ---
$fecha = (Get-Date).ToUniversalTime().ToString("o")
$header = @"
-- ============================================================
-- POS-iaDoS v$version`: Seed completo exportado de BD local
-- Generado: $fecha
-- ============================================================
USE ${DB_NAME};
SET SESSION check_constraint_checks=OFF;
SET FOREIGN_KEY_CHECKS=0;

"@

Set-Content -Path $outFile -Value $header -Encoding UTF8

# --- Exportar cada tabla ---
foreach ($tabla in $tablas) {
    Write-Host "  Exportando: $tabla..." -NoNewline

    $args = @(
        "-h$DB_HOST", "-P$DB_PORT", "-u$DB_USER", "--password=$DB_PASS",
        "--no-create-info",       # solo datos, no CREATE TABLE
        "--insert-ignore",        # INSERT IGNORE para no fallar si ya existe
        "--skip-triggers",
        "--skip-lock-tables",
        "--no-tablespaces",
        "--complete-insert",      # incluir nombres de columnas
        "--single-transaction",
        $DB_NAME, $tabla
    )

    try {
        $output = & $mysqldump @args 2>&1
        # Filtrar lineas de warning/comentario de mysqldump, dejar solo los INSERT
        $inserts = $output | Where-Object { $_ -match "^INSERT" }
        $count = $inserts.Count

        if ($count -gt 0) {
            Add-Content -Path $outFile -Value "-- $tabla ($count filas)" -Encoding UTF8
            $inserts | Add-Content -Path $outFile -Encoding UTF8
            Add-Content -Path $outFile -Value "" -Encoding UTF8
            Write-Host " $count filas" -ForegroundColor Green
        } else {
            Add-Content -Path $outFile -Value "-- $tabla (0 filas)" -Encoding UTF8
            Write-Host " (vacia)" -ForegroundColor Gray
        }
    } catch {
        Write-Host " ERROR: $_" -ForegroundColor Red
    }
}

# --- Footer ---
$footer = @"

-- Asegurar passwords conocidos (admin123 / cajero123)
UPDATE users SET password='\$2a\$10\$vxlPjwiQUu/dK/gyUB.DI.2HJakEqGynxOjwwqZZpCax8dOqRuvoy' WHERE rol='superadmin';
UPDATE users SET password='\$2a\$10\$vxlPjwiQUu/dK/gyUB.DI.2HJakEqGynxOjwwqZZpCax8dOqRuvoy' WHERE rol='admin';
UPDATE users SET password='\$2a\$10\$2GE3so4U7kcdP5u0xd97QO7IeIripbjEuSqdAHqugrpKnxQOgskl6' WHERE rol IN ('cajero','mesero','manager');

SET FOREIGN_KEY_CHECKS=1;
"@

Add-Content -Path $outFile -Value $footer -Encoding UTF8

$size = [math]::Round((Get-Item $outFile).Length / 1KB, 1)
Write-Host ""
Write-Host "  Seed generado: $outFile ($size KB)" -ForegroundColor Green
Write-Host "  Ahora corre entorno.bat [6] para incluirlo en el EXE" -ForegroundColor Yellow
Write-Host ""
