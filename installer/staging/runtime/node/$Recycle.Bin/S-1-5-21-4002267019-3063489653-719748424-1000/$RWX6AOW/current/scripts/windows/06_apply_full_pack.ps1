param(
  [string]$Root = "C:\sites\emc_abastos\current"
)

Set-Location $Root

Write-Host "1) Ensure directories..."
$dirs = @(
  "config","app\Providers","app\Models","app\Http\Middleware",
  "resources\views\layouts","resources\views\empresa","resources\views\admin\productos","resources\views\ops\ordenes",
  "storage\app\public","storage\framework\cache\data","storage\framework\sessions","storage\framework\views","storage\logs"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null }

Write-Host "2) Register middleware aliases in app/Http/Kernel.php (best-effort)..."
$kernelPath = Join-Path $Root "app\Http\Kernel.php"
if (Test-Path $kernelPath) {
  $k = Get-Content $kernelPath -Raw

  # Laravel 10/11 uses $middlewareAliases. Older uses $routeMiddleware.
  if ($k -match "\$middlewareAliases") {
    if ($k -notmatch "'empresa'") {
      $k = $k -replace "protected \\$middlewareAliases\\s*=\\s*\\[", "protected \$middlewareAliases = [`r`n        'empresa' => \\App\\Http\\Middleware\\EnsureEmpresaSelected::class,`r`n        'role' => \\App\\Http\\Middleware\\RequireRole::class,"
    }
  } elseif ($k -match "\$routeMiddleware") {
    if ($k -notmatch "'empresa'") {
      $k = $k -replace "protected \\$routeMiddleware\\s*=\\s*\\[", "protected \$routeMiddleware = [`r`n        'empresa' => \\App\\Http\\Middleware\\EnsureEmpresaSelected::class,`r`n        'role' => \\App\\Http\\Middleware\\RequireRole::class,"
    }
  } else {
    Write-Warning "Kernel.php structure not recognized; add middleware aliases manually using app/Http/Kernel.patch.txt"
  }

  Set-Content -Path $kernelPath -Value $k -Encoding UTF8
} else {
  Write-Warning "Kernel.php not found; add middleware aliases manually."
}

Write-Host "3) Autoload + clear caches..."
composer dump-autoload -o
php artisan optimize:clear

Write-Host "DONE. Try: http://emc_abastos.com/ then login, then /empresa to select empresa."
