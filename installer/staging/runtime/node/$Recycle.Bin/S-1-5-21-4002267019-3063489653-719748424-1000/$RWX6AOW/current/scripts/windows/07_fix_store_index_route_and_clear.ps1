param(
  [Parameter(Mandatory=$false)][string]$Root = "C:\sites\emc_abastos\current",
  [Parameter(Mandatory=$false)][string]$Php  = "C:\php\php.exe"
)

Write-Host "== EMC Hotfix: store.index route + clear caches =="

$web = Join-Path $Root "routes\web.php"
if (!(Test-Path $web)) { throw "No existe: $web" }

$content = Get-Content $web -Raw

# 1) Asegurar que exista name('store.index') en la ruta home "/"
if ($content -notmatch "name\(\s*['""]store\.index['""]\s*\)") {

  # Caso A: ya existe Route::get('/', ...) => agregar ->name('store.index')
  if ($content -match "Route::get\(\s*['""]\/['""]") {
    $content2 = [regex]::Replace(
      $content,
      "(Route::get\(\s*['""]\/['""][^\;]*?)\s*;\s*",
      { param($m)
        $line = $m.Groups[1].Value
        if ($line -match "->name\(") { return $m.Value } # ya tiene name
        return ($line + "->name('store.index');`r`n")
      },
      1, [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if ($content2 -eq $content) {
      # fallback: no se pudo reemplazar, entonces agregamos una ruta nueva al final
      $content2 = $content + "`r`nRoute::get('/', function () { return view('store.index'); })->name('store.index');`r`n"
    }
    $content = $content2
  }
  else {
    # Caso B: no hay ruta "/" => agregarla
    $content = $content + "`r`nRoute::get('/', function () { return view('store.index'); })->name('store.index');`r`n"
  }

  Set-Content -Path $web -Value $content -Encoding UTF8
  Write-Host "OK: store.index registrado en routes\web.php"
}
else {
  Write-Host "OK: store.index ya estaba registrado"
}

# 2) Limpiar caches a mano (en Windows a veces quedan views compiladas)
$pathsToClear = @(
  (Join-Path $Root "storage\framework\views\*.php"),
  (Join-Path $Root "bootstrap\cache\*.php"),
  (Join-Path $Root "storage\framework\cache\data\*")
)

foreach ($p in $pathsToClear) {
  Get-ChildItem $p -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
}

# 3) Limpiar caches via artisan (si php existe)
if (Test-Path $Php) {
  & $Php (Join-Path $Root "artisan") optimize:clear
} else {
  Write-Host "WARN: No se encontró PHP en $Php (saltando optimize:clear)"
}

Write-Host "DONE. Abre: http://emc_abastos.com/ (o /) y reintenta."
