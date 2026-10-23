# =============================================================================
#  POS-iaDoS - DIAGNOSTICO DE LA ACTUALIZACION
#
#  Solo LEE. No detiene servicios, no escribe en la base, no cambia nada.
#  No muestra contrasenas: del .env solo lee APP_VERSION, DB_HOST, DB_PORT y
#  DB_DATABASE.
#
#  Uso (desde CMD o desde PowerShell, da igual):
#     powershell -NoProfile -ExecutionPolicy Bypass -File "DIAGNOSTICO-ACTUALIZACION.ps1"
#
#  Deja una copia del resultado en el Escritorio: DIAGNOSTICO-POS-<fecha>.txt
# =============================================================================
param([string]$InstallDir = "C:\POS-iaDoS")

$ErrorActionPreference = "Continue"
$R = New-Object System.Collections.ArrayList

function L { param([string]$t = "") [void]$R.Add($t); Write-Host $t }
function T { param([string]$t) L ""; L "== $t" }

function Seccion {
    param([string]$Titulo, [scriptblock]$Bloque)
    T $Titulo
    try {
        $salida = & $Bloque 2>&1 | Out-String -Width 220
        foreach ($l in ($salida -split "`r?`n")) { if ($l.Trim() -ne "") { L "   $l" } }
    } catch {
        L "   (no se pudo leer: $($_.Exception.Message))"
    }
}

function Cola {
    param([string]$Ruta, [int]$N = 40)
    if (-not (Test-Path $Ruta)) { return "(no existe $Ruta)" }
    Get-Content -Path $Ruta -Tail $N -Encoding UTF8
}

L "POS-iaDoS - DIAGNOSTICO  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')   equipo $env:COMPUTERNAME"
L "Carpeta: $InstallDir"
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
L "Administrador: $admin"

Seccion "version.json" { Get-Content -Path (Join-Path $InstallDir "version.json") -Encoding UTF8 }

Seccion ".env (sin contrasenas)" {
    Get-Content -Path (Join-Path $InstallDir "backend\.env") -Encoding UTF8 |
        Where-Object { $_ -match '^\s*(APP_VERSION|DB_HOST|DB_PORT|DB_DATABASE|PORT|APP_PORT|NODE_ENV)\s*=' }
}

Seccion "servicios" {
    Get-CimInstance Win32_Service -Filter "Name LIKE 'PosIaDos%'" |
        Select-Object Name, State, StartMode, PathName | Format-List
}

Seccion "lo que contesta el servidor (/api/health)" {
    (Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10).Content
}

Seccion "pantalla que sirve el servidor" {
    $html = (Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing -TimeoutSec 10).Content
    if ($html -match 'assets/index-[^"'']+\.js') { "js principal: $($Matches[0])" } else { "no se encontro el js principal" }
}

Seccion "fechas del programa y las pantallas" {
    foreach ($rel in @("backend\dist\main.js", "backend\public\index.html", "frontend\dist-prod\index.html", "version.json")) {
        $p = Join-Path $InstallDir $rel
        if (Test-Path $p) {
            $i = Get-Item $p
            $js = ""
            if ($rel -like "*index.html") {
                $c = Get-Content -Path $p -Raw -Encoding UTF8
                if ($c -match 'assets/index-[^"'']+\.js') { $js = "  -> $($Matches[0])" }
            }
            "{0,-32} {1:dd/MM/yyyy HH:mm}{2}" -f $rel, $i.LastWriteTime, $js
        } else {
            "{0,-32} (no existe)" -f $rel
        }
    }
}

Seccion "herramientas (tools)" {
    Get-ChildItem -Path (Join-Path $InstallDir "tools") -Filter *.ps1 -ErrorAction Stop |
        Sort-Object LastWriteTime | Select-Object Name, LastWriteTime | Format-Table -AutoSize
}

Seccion "respaldos (los 5 mas nuevos)" {
    Get-ChildItem -Path (Join-Path $InstallDir "backups") -Directory -ErrorAction Stop |
        Sort-Object LastWriteTime | Select-Object -Last 5 Name, LastWriteTime | Format-Table -AutoSize
}

$ultimo = Get-ChildItem -Path (Join-Path $InstallDir "backups") -Directory -ErrorAction SilentlyContinue |
          Sort-Object LastWriteTime | Select-Object -Last 1
if ($ultimo) {
    foreach ($log in (Get-ChildItem -Path $ultimo.FullName -Filter *.log -ErrorAction SilentlyContinue)) {
        Seccion "respaldo $($ultimo.Name)\$($log.Name)" { Cola -Ruta $log.FullName -N 60 }
    }
}

Seccion "candado de mantenimiento" {
    $c = Join-Path $InstallDir "logs\mantenimiento-en-curso.json"
    if (Test-Path $c) { "EXISTE:"; Get-Content $c -Encoding UTF8 } else { "no hay candado" }
}

Seccion "logs\install.log (final)" { Cola -Ruta (Join-Path $InstallDir "logs\install.log") -N 40 }

Seccion "logs\backend-error.log (final)" {
    $e = Get-ChildItem -Path (Join-Path $InstallDir "logs") -Filter "backend*err*.log" -ErrorAction SilentlyContinue |
         Sort-Object LastWriteTime | Select-Object -Last 1
    if ($e) { "archivo: $($e.Name)"; Cola -Ruta $e.FullName -N 25 } else { "(no hay)" }
}

# La bitacora del propio EXE (Inno Setup) dice con que codigo termino install.ps1.
Seccion "bitacora del EXE (Setup Log)" {
    $carpetas = @($env:TEMP, "C:\Windows\Temp") + @(Get-ChildItem "C:\Users\*\AppData\Local\Temp" -Directory -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
    $logs = foreach ($c in ($carpetas | Select-Object -Unique)) {
        Get-ChildItem -Path $c -Filter "Setup Log*.txt" -ErrorAction SilentlyContinue
    }
    $s = $logs | Sort-Object LastWriteTime | Select-Object -Last 1
    if (-not $s) { "(no se encontro)" } else {
        "archivo: $($s.FullName)  ($($s.LastWriteTime))"
        Get-Content -Path $s.FullName -Encoding Default |
            Where-Object { $_ -match 'Setup version|Original Setup EXE|exit code|Run entry|Filename:|Exception|Error|Installation process succeeded|Need to restart|Log closed' }
    }
}

$sello = Get-Date -Format "yyyyMMdd-HHmm"
$destinos = @([Environment]::GetFolderPath("Desktop"), (Join-Path $InstallDir "logs"))
foreach ($d in $destinos) {
    try {
        if ($d -and (Test-Path $d)) {
            $f = Join-Path $d "DIAGNOSTICO-POS-$sello.txt"
            [System.IO.File]::WriteAllText($f, ($R -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))
            Write-Host ""
            Write-Host "Guardado en: $f" -ForegroundColor Green
        }
    } catch { }
}
