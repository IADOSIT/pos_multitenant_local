param(
  [string]$Root = "C:\sites\emc_abastos\current",
  [string]$Php = "C:\php\php.exe"
)

Set-Location $Root

Write-Host "0) Ensure dirs..."
$dirs = @(
  "bootstrap\cache",
  "storage\framework\cache\data",
  "storage\framework\sessions",
  "storage\framework\views",
  "storage\logs"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null }

Write-Host "1) Force safe env stores (file cache/session)..."
$envPath = Join-Path $Root ".env"
if (Test-Path $envPath) {
  $raw = Get-Content $envPath -Raw -Encoding UTF8
  function Upsert([string]$k,[string]$v){
    $pattern = "^(?m)" + [Regex]::Escape($k) + "=.*$"
    if ($raw -match $pattern) { $script:raw = [Regex]::Replace($script:raw,$pattern,"$k=$v") }
    else { $script:raw = $script:raw.TrimEnd() + "`r`n$k=$v`r`n" }
  }
  Upsert "CACHE_STORE" "file"
  Upsert "SESSION_DRIVER" "file"
  Upsert "QUEUE_CONNECTION" "sync"
  Set-Content -Path $envPath -Value $raw -Encoding UTF8
}

Write-Host "2) Composer autoload..."
composer dump-autoload -o

Write-Host "3) Clear caches..."
& $Php artisan optimize:clear

Write-Host "4) Migrate..."
& $Php artisan migrate --force -v --step

Write-Host "5) Seed enterprise demo..."
& $Php artisan db:seed --class=Database\Seeders\EnterpriseDemoSeeder --force

Write-Host "DONE ✅"
Write-Host "URLs: / (tienda), /carrito, /checkout, /login, /empresa, /admin, /ops"
Write-Host "Demo login: admin@abastos.local / ChangeMe#2026"
