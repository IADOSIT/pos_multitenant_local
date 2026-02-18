param(
  [string]$Root = "C:\sites\emc_abastos\current"
)

Set-Location $Root

$controllerPath = Join-Path $Root "app\Http\Controllers\Controller.php"

if (!(Test-Path $controllerPath)) {
  Write-Host "Controller.php missing, creating..."
  New-Item -ItemType Directory -Force -Path (Split-Path $controllerPath -Parent) | Out-Null

  $php = @'
<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
}
'@
  Set-Content -Path $controllerPath -Value $php -Encoding UTF8
} else {
  Write-Host "Controller.php exists."
}

Write-Host "Verifying PSR-4 autoload..."
$composerJson = Get-Content (Join-Path $Root "composer.json") -Raw
if ($composerJson -notmatch '"App\\\\\\\\":\s*"app\/"') {
  Write-Warning "composer.json autoload psr-4 may not include App\\ => app/. Please verify."
}

# Clear cached bootstrap (safe)
Remove-Item -Force (Join-Path $Root "bootstrap\cache\config.php") -ErrorAction SilentlyContinue
Remove-Item -Force (Join-Path $Root "bootstrap\cache\services.php") -ErrorAction SilentlyContinue
Remove-Item -Force (Join-Path $Root "bootstrap\cache\packages.php") -ErrorAction SilentlyContinue

# Quick check without composer
Write-Host "PHP class_exists check:"
php -r "require 'vendor/autoload.php'; echo class_exists('App\\\\Http\\\\Controllers\\\\Controller') ? 'OK' : 'NO'; echo PHP_EOL;"

Write-Host "Done. If still NO, ensure this script ran inside the right Root and that file path is correct."
