# POS-iaDoS — Abre el sistema en Chrome/Edge con impresion automatica silenciosa
# --kiosk-printing: imprime sin dialogo de confirmacion
# --app: modo aplicacion (sin barra de direccion, como app nativa)

$URL = "http://localhost:3000"

$browsers = @(
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$browser = $browsers | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($browser) {
    Start-Process $browser "--kiosk-printing --app=$URL"
} else {
    Start-Process $URL
}
