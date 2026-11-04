# Convierte instalacion.html y operacion.html en los PDF de installer\manuales con Chrome sin ventana.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File installer\manuales\fuentes\generar-pdf.ps1
$ErrorActionPreference = 'Stop'
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$salida = Split-Path -Parent $aqui
$chrome = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'No encontre Chrome ni Edge' }
$perfil = Join-Path $env:TEMP 'pos-manuales-pdf'
$pares = @(
    @('instalacion.html', 'Manual-Instalacion-POS-iaDoS.pdf'),
    @('operacion.html', 'Manual-Operacion-POS-iaDoS.pdf')
)
foreach ($par in $pares) {
    $html = 'file:///' + ((Join-Path $aqui $par[0]) -replace '\\', '/')
    $pdf = Join-Path $salida $par[1]
    $argumentos = @('--headless=new', '--disable-gpu', '--no-first-run', "`"--user-data-dir=$perfil`"", '--no-pdf-header-footer', "`"--print-to-pdf=$pdf`"", "`"$html`"")
    Start-Process -FilePath $chrome -ArgumentList $argumentos -Wait -WindowStyle Hidden
    if (-not (Test-Path $pdf)) { throw "No se genero $pdf" }
    '{0}  {1} KB' -f $pdf, [math]::Round((Get-Item $pdf).Length / 1KB)
}
