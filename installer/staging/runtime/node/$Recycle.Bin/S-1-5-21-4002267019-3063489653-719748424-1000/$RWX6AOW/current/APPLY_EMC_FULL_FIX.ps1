param(
  [Parameter(Mandatory=$true)][string]$Root,
  [Parameter(Mandatory=$true)][string]$Php
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }

function Replace-InFile {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Pattern,
    [Parameter(Mandatory=$true)][string]$Replacement
  )
  if (!(Test-Path -LiteralPath $Path)) { return }
  $content = Get-Content -LiteralPath $Path -Raw
  $new = [Regex]::Replace($content, $Pattern, $Replacement)
  if ($new -ne $content) {
    Set-Content -LiteralPath $Path -Value $new -Encoding UTF8
  }
}

function Ensure-DirWritable {
  param([Parameter(Mandatory=$true)][string]$Path)

  if (!(Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }

  $ids = @()
  try { $ids += [System.Security.Principal.WindowsIdentity]::GetCurrent().Name } catch {}
  $ids += @("Users","IIS_IUSRS","IUSR")

  foreach ($id in $ids) {
    try {
      icacls $Path /grant "${id}:(OI)(CI)M" /T /C | Out-Null
    } catch { }
  }
}

Write-Info "== EMC FULL FIX (routes + StoreController + permissions) =="

if (!(Test-Path -LiteralPath $Root)) { throw "Root path not found: $Root" }
if (!(Test-Path -LiteralPath $Php))  { throw "PHP exe not found: $Php"  }

# 1) Fix bootstrap/cache permissions
$bootstrapCache = Join-Path $Root "bootstrap\cache"
Write-Info "Fixing permissions: $bootstrapCache"
Ensure-DirWritable -Path $bootstrapCache

# 2) Write StoreController clean (NO PowerShell variable expansion)
$storeCtrl = Join-Path $Root "app\Http\Controllers\StoreController.php"
Write-Info "Writing clean StoreController.php"

$storeControllerPhp = @'
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Producto;
use App\Models\Orden;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $categoriaId = $request->query('categoria_id');

        $productos = Producto::query()
            ->when($q !== '', fn($qq) => $qq->where('nombre', 'ilike', "%{$q}%"))
            ->when($categoriaId, fn($qq) => $qq->where('categoria_id', $categoriaId))
            ->where('activo', true)
            ->orderBy('id', 'desc')
            ->paginate(12)
            ->withQueryString();

        return view('store.index', compact('productos', 'q', 'categoriaId'));
    }

    public function show(Producto $producto)
    {
        abort_unless($producto->activo, 404);
        return view('store.producto', compact('producto'));
    }

    public function track($folio)
    {
        $orden = Orden::where('folio', $folio)->firstOrFail();
        return view('store.track', compact('orden'));
    }
}
'@

Set-Content -LiteralPath $storeCtrl -Value $storeControllerPhp -Encoding UTF8

# 3) Patch routes/web.php
$routes = Join-Path $Root "routes\web.php"
if (!(Test-Path -LiteralPath $routes)) { throw "routes/web.php not found" }

Write-Info "Patching routes/web.php"

# Ensure StoreController import exists
$contentRoutes = Get-Content -LiteralPath $routes -Raw
if ($contentRoutes -notmatch 'use\s+App\\Http\\Controllers\\StoreController;') {
  if ($contentRoutes -match '<\?php') {
    $contentRoutes = $contentRoutes -replace '(<\?php\s*)', "`$1`r`nuse App\Http\Controllers\StoreController;`r`n"
  } else {
    $contentRoutes = "use App\Http\Controllers\StoreController;`r`n" + $contentRoutes
  }
  Set-Content -LiteralPath $routes -Value $contentRoutes -Encoding UTF8
}

# Ensure root route exists and is named store.index
Replace-InFile -Path $routes `
  -Pattern "Route::get\(\s*'\/'\s*,\s*\[StoreController::class\s*,\s*'index'\]\s*\)\s*->name\('store\.(home|index)'\)\s*;" `
  -Replacement "Route::get('/', [StoreController::class, 'index'])->name('store.index');"

$contentRoutes = Get-Content -LiteralPath $routes -Raw
if ($contentRoutes -notmatch "Route::get\(\s*'\/'\s*,\s*\[StoreController::class\s*,\s*'index'\]") {
  # insert after first block of use statements (or at top)
  if ($contentRoutes -match "(use .+;\s*(\r?\n))+") {
    $contentRoutes = [Regex]::Replace(
      $contentRoutes,
      "(use .+;\s*(\r?\n))+",
      "`$0`r`nRoute::get('/', [StoreController::class, 'index'])->name('store.index');`r`n`r`n",
      1
    )
  } else {
    $contentRoutes = "Route::get('/', [StoreController::class, 'index'])->name('store.index');`r`n`r`n" + $contentRoutes
  }
  Set-Content -LiteralPath $routes -Value $contentRoutes -Encoding UTF8
}

# Make /dashboard safe (redirect to store.index)
Replace-InFile -Path $routes `
  -Pattern "Route::get\(\s*'\/dashboard'\s*,\s*function\s*\(\)\s*\{[\s\S]*?\}\s*\)\s*;" `
  -Replacement "Route::get('/dashboard', function () { return redirect()->route('store.index'); });"

# 4) Replace store.home references in views to store.index
$viewFiles = @(
  (Join-Path $Root "resources\views\store\track.blade.php"),
  (Join-Path $Root "resources\views\store\index.blade.php"),
  (Join-Path $Root "resources\views\layouts\store.blade.php"),
  (Join-Path $Root "resources\views\layouts\admin.blade.php")
)
foreach ($vf in $viewFiles) {
  if (Test-Path -LiteralPath $vf) {
    Replace-InFile -Path $vf -Pattern "route\('store\.home'\)" -Replacement "route('store.index')"
  }
}

# 5) Remove Cliente dependency (if controller exists)
$dashCtrl = Join-Path $Root "app\Http\Controllers\Admin\DashboardController.php"
if (Test-Path -LiteralPath $dashCtrl) {
  Write-Info "Patching Admin DashboardController.php (remove Cliente dependency)"
  Replace-InFile -Path $dashCtrl -Pattern "use\s+App\\Models\\Cliente;\s*" -Replacement "// use App\Models\Cliente;`r`n"
  Replace-InFile -Path $dashCtrl -Pattern "(\$clientes\s*=\s*)\(?\s*int\s*\)?\s*Cliente::[^;]+;" -Replacement "`$1 0; // FIX: Cliente model removed"
  Replace-InFile -Path $dashCtrl -Pattern "Cliente::[^;]+;" -Replacement "`$clientes = 0; // FIX: Cliente model removed`r`n"
}

Write-Info "Clearing caches..."
try { & $Php (Join-Path $Root "artisan") "optimize:clear" | Out-Null } catch {}

Write-Ok "DONE. Prueba: / y /login"
Write-Ok "Verifica rutas:"
Write-Ok "  C:\php\php.exe artisan route:list | Select-String store.index"
