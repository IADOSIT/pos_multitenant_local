param(
  [string]$RepoUrl = "https://github.com/AxelYagami/emc_abastos.git",
  [string]$WorkDir = (Join-Path (Get-Location) "emc_abastos_work"),
  [string]$ProjectSubDir = "current",
  [int]$PgPort = 54322,
  [string]$DbName = "emc_abastos",
  [string]$DbUser = "emc",
  [string]$DbPass = "emc",
  [int]$AppPort = 8000,
  [switch]$SkipNpm
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info($m) { Write-Host $m -ForegroundColor Cyan }
function Write-Ok($m) { Write-Host $m -ForegroundColor Green }
function Write-Warn($m) { Write-Host $m -ForegroundColor Yellow }
function Write-Err($m) { Write-Host $m -ForegroundColor Red }

function Assert-Cmd([string]$name, [string]$help) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "No se encontró '$name'. $help"
  }
}

function Run([string]$cmd, [string]$work = "") {
  Write-Info ">> $cmd"
  if ($work -ne "") {
    & powershell -NoProfile -ExecutionPolicy Bypass -Command "cd `"$work`"; $cmd"
  } else {
    & powershell -NoProfile -ExecutionPolicy Bypass -Command $cmd
  }
}

function Write-Utf8NoBomFile([string]$path, [string]$content) {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  $dir = Split-Path -Parent $path
  if ($dir -and !(Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
}

function Backup-IfExists([string]$path) {
  if (Test-Path -LiteralPath $path) {
    $stamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
    $bak = "$path.bak.$stamp"
    Copy-Item -LiteralPath $path -Destination $bak -Force
    Write-Warn "Backup: $bak"
  }
}

function Set-EnvValue([string]$envPath, [string]$key, [string]$value) {
  $content = ""
  if (Test-Path -LiteralPath $envPath) { $content = Get-Content -LiteralPath $envPath -Raw }

  $escapedKey = [Regex]::Escape($key)
  $line = "$key=$value"

  if ($content -match "(?m)^\s*$escapedKey\s*=") {
    $content = [Regex]::Replace($content, "(?m)^\s*$escapedKey\s*=.*$", $line)
  } else {
    if ($content -and -not $content.EndsWith("`n")) { $content += "`r`n" }
    $content += $line + "`r`n"
  }

  Write-Utf8NoBomFile $envPath $content
}

function Ensure-TextInFile([string]$path, [string]$needle, [string]$appendBlock) {
  if (!(Test-Path -LiteralPath $path)) { throw "No existe el archivo: $path" }
  $c = Get-Content -LiteralPath $path -Raw
  if ($c -notmatch [Regex]::Escape($needle)) {
    if (-not $c.EndsWith("`n")) { $c += "`r`n" }
    $c += "`r`n" + $appendBlock + "`r`n"
    Write-Utf8NoBomFile $path $c
  }
}

Write-Info "=== EMC Abastos | One-click setup + fixes + validación ==="

# Pre-reqs
Assert-Cmd git "Instala Git (Windows: Git for Windows) y vuelve a ejecutar."
Assert-Cmd php "Instala PHP 8.x y agrega php.exe al PATH."
Assert-Cmd composer "Instala Composer y agrega composer al PATH."

$hasDocker = [bool](Get-Command docker -ErrorAction SilentlyContinue)
if (-not $hasDocker) {
  Write-Warn "Docker NO detectado. Este script asume PostgreSQL. Instala Docker Desktop o configura tu Postgres manualmente."
} else {
  Write-Ok "Docker detectado."
}

# Clone / update repo
if (!(Test-Path -LiteralPath $WorkDir)) {
  Write-Info "Clonando repo en: $WorkDir"
  Run "git clone --depth 1 `"$RepoUrl`" `"$WorkDir`""
} else {
  if (Test-Path -LiteralPath (Join-Path $WorkDir ".git")) {
    Write-Info "Repo ya existe. Actualizando (git pull)..."
    Run "git -C `"$WorkDir`" pull"
  } else {
    throw "WorkDir existe pero no es repo git: $WorkDir"
  }
}

$ProjectRoot = Join-Path $WorkDir $ProjectSubDir
if (!(Test-Path -LiteralPath $ProjectRoot)) { throw "No existe $ProjectSubDir dentro de $WorkDir. Esperado: $ProjectRoot" }
if (!(Test-Path -LiteralPath (Join-Path $ProjectRoot "artisan"))) { throw "No se detectó Laravel (falta artisan) en: $ProjectRoot" }

Write-Ok "Proyecto Laravel detectado en: $ProjectRoot"

# Start Postgres via Docker (recommended)
if ($hasDocker) {
  $containerName = "emc_abastos_pg"
  $exists = (docker ps -a --format "{{.Names}}" | Select-String -SimpleMatch $containerName) -ne $null
  if (-not $exists) {
    Write-Info "Creando contenedor PostgreSQL: $containerName (puerto host $PgPort -> 5432)"
    Run "docker run -d --name $containerName -e POSTGRES_DB=$DbName -e POSTGRES_USER=$DbUser -e POSTGRES_PASSWORD=$DbPass -p ${PgPort}:5432 postgres:16"
  } else {
    Write-Info "Iniciando contenedor PostgreSQL: $containerName"
    Run "docker start $containerName"
  }

  Write-Info "Esperando a que PostgreSQL esté listo..."
  $ready = $false
  for ($i=0; $i -lt 60; $i++) {
    try {
      $out = docker exec $containerName pg_isready -U $DbUser 2>$null
      if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    } catch {}
    Start-Sleep -Seconds 1
  }
  if (-not $ready) { throw "PostgreSQL no respondió a tiempo. Revisa Docker / contenedor $containerName." }
  Write-Ok "PostgreSQL listo."
}

# Ensure .env
$envExample = Join-Path $ProjectRoot ".env.example"
$envPath    = Join-Path $ProjectRoot ".env"
if (!(Test-Path -LiteralPath $envPath)) {
  if (!(Test-Path -LiteralPath $envExample)) { throw "No existe .env ni .env.example en $ProjectRoot" }
  Copy-Item -LiteralPath $envExample -Destination $envPath -Force
  Write-Ok "Se creó .env desde .env.example"
}

# Configure env for PG + app url
Set-EnvValue $envPath "APP_URL" ("http://127.0.0.1:{0}" -f $AppPort)
Set-EnvValue $envPath "DB_CONNECTION" "pgsql"
Set-EnvValue $envPath "DB_HOST" "127.0.0.1"
Set-EnvValue $envPath "DB_PORT" "$PgPort"
Set-EnvValue $envPath "DB_DATABASE" $DbName
Set-EnvValue $envPath "DB_USERNAME" $DbUser
Set-EnvValue $envPath "DB_PASSWORD" $DbPass

# Para evitar depender de queue worker en demo/local:
Set-EnvValue $envPath "QUEUE_CONNECTION" "sync"

# Install PHP deps
Write-Info "Instalando dependencias composer..."
Run "composer install --no-interaction --prefer-dist" $ProjectRoot

# Install/build front assets (optional)
if (-not $SkipNpm) {
  $hasNode = [bool](Get-Command node -ErrorAction SilentlyContinue)
  $hasNpm  = [bool](Get-Command npm  -ErrorAction SilentlyContinue)
  if ($hasNode -and $hasNpm -and (Test-Path -LiteralPath (Join-Path $ProjectRoot "package.json"))) {
    Write-Info "Instalando dependencias npm..."
    Run "npm install" $ProjectRoot
    Write-Info "Compilando assets..."
    try {
      Run "npm run build" $ProjectRoot
    } catch {
      Write-Warn "Falló npm run build. Continúo (para backend no es bloqueante). Detalle: $($_.Exception.Message)"
    }
  } else {
    Write-Warn "Node/npm no detectado o no hay package.json. Saltando build de frontend."
  }
} else {
  Write-Warn "SkipNpm activado. Saltando npm."
}

# Key generate
Write-Info "Generando APP_KEY si hace falta..."
Run "php artisan key:generate --force" $ProjectRoot

# Run repo-provided fix script (routes + StoreController + permisos)
$fullFix = Join-Path $ProjectRoot "APPLY_EMC_FULL_FIX.ps1"
if (Test-Path -LiteralPath $fullFix) {
  Write-Info "Ejecutando fix oficial del repo: APPLY_EMC_FULL_FIX.ps1"
  Run ("powershell -NoProfile -ExecutionPolicy Bypass -File `"{0}`" -Root `"{1}`" -Php `"php`"" -f $fullFix, $ProjectRoot) $ProjectRoot
} else {
  Write-Warn "No existe APPLY_EMC_FULL_FIX.ps1. Continúo."
}

# Optional: login/routes all-in-one fix (si existe)
$loginFix = Join-Path $ProjectRoot "FIX_LOGIN_ROUTES_ALLINONE.ps1"
if (Test-Path -LiteralPath $loginFix) {
  Write-Info "Ejecutando fix login/routes del repo: FIX_LOGIN_ROUTES_ALLINONE.ps1"
  try {
    Run ("powershell -NoProfile -ExecutionPolicy Bypass -File `"{0}`" -Root `"{1}`" -Php `"php`"" -f $loginFix, $ProjectRoot) $ProjectRoot
  } catch {
    Write-Warn "FIX_LOGIN_ROUTES_ALLINONE.ps1 falló, continúo. Detalle: $($_.Exception.Message)"
  }
}

# ---------------------------
# PATCH: CartController estable + rutas + AJAX en layout store
# ---------------------------
$cartControllerPath = Join-Path $ProjectRoot "app\Http\Controllers\CartController.php"
Backup-IfExists $cartControllerPath

$cartControllerPhp = @'
<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;

class CartController extends Controller
{
    private function buildSummary(): array
    {
        $cart = session()->get('cart', []);
        $ids = array_map('intval', array_keys($cart));

        $items = [];
        $total = 0.0;
        $count = 0;

        if (!empty($ids)) {
            $productos = Producto::whereIn('id', $ids)->get()->keyBy('id');

            foreach ($cart as $pid => $qty) {
                $p = $productos->get((int) $pid);
                if (!$p) {
                    continue;
                }

                $qty = max(1, (int) $qty);
                $precio = (float) ($p->precio ?? 0);

                $items[] = [
                    'producto' => $p,
                    'qty' => $qty,
                    'subtotal' => $precio * $qty,
                ];

                $count += $qty;
                $total += $precio * $qty;
            }
        }

        return [
            'items' => $items,
            'count' => $count,
            'total' => round($total, 2),
        ];
    }

    public function index()
    {
        $summary = $this->buildSummary();

        return view('store.cart', [
            'items' => $summary['items'],
            'total' => $summary['total'],
        ]);
    }

    public function summary(Request $request)
    {
        $summary = $this->buildSummary();

        return response()->json([
            'success' => true,
            'count' => $summary['count'],
            'total' => $summary['total'],
        ]);
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'producto_id' => ['required', 'integer'],
            'qty' => ['nullable', 'integer', 'min:1', 'max:999'],
        ]);

        $empresaId = session('empresa_id');

        $producto = Producto::query()
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->where('id', $data['producto_id'])
            ->where('activo', true)
            ->first();

        if (!$producto) {
            return response()->json([
                'success' => false,
                'message' => 'Producto no encontrado o no disponible.',
            ], 404);
        }

        $cart = session()->get('cart', []);
        $qty = (int) ($data['qty'] ?? 1);

        $cart[$producto->id] = ((int) ($cart[$producto->id] ?? 0)) + $qty;
        session()->put('cart', $cart);

        $summary = $this->buildSummary();

        return response()->json([
            'success' => true,
            'message' => 'Producto agregado al carrito.',
            'count' => $summary['count'],
            'total' => $summary['total'],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'producto_id' => ['required', 'integer'],
            'qty' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $cart = session()->get('cart', []);
        $pid = (int) $data['producto_id'];

        if (!array_key_exists($pid, $cart)) {
            return response()->json([
                'success' => false,
                'message' => 'Producto no existe en el carrito.',
            ], 404);
        }

        $cart[$pid] = (int) $data['qty'];
        session()->put('cart', $cart);

        $summary = $this->buildSummary();

        return response()->json([
            'success' => true,
            'count' => $summary['count'],
            'total' => $summary['total'],
        ]);
    }

    public function remove(Request $request)
    {
        $data = $request->validate([
            'producto_id' => ['required', 'integer'],
        ]);

        $cart = session()->get('cart', []);
        unset($cart[(int) $data['producto_id']]);
        session()->put('cart', $cart);

        $summary = $this->buildSummary();

        return response()->json([
            'success' => true,
            'count' => $summary['count'],
            'total' => $summary['total'],
        ]);
    }

    public function clear(Request $request)
    {
        session()->forget('cart');

        return response()->json([
            'success' => true,
            'count' => 0,
            'total' => 0,
        ]);
    }
}
'@

Write-Utf8NoBomFile $cartControllerPath $cartControllerPhp
Write-Ok "CartController.php aplicado."

# Patch routes/web.php with cart routes (idempotente)
$routesPath = Join-Path $ProjectRoot "routes\web.php"
if (!(Test-Path -LiteralPath $routesPath)) { throw "No existe routes/web.php en $ProjectRoot" }

# Ensure import
$routesContent = Get-Content -LiteralPath $routesPath -Raw
if ($routesContent -notmatch "use\s+App\\Http\\Controllers\\CartController;") {
  if ($routesContent -match "<\?php") {
    $routesContent = [Regex]::Replace($routesContent, "(<\?php\s*)", "`$1`r`nuse App\Http\Controllers\CartController;`r`n", 1)
  } else {
    $routesContent = "use App\Http\Controllers\CartController;`r`n" + $routesContent
  }
  Write-Utf8NoBomFile $routesPath $routesContent
}

$cartRoutesBlock = @'
/**
 * EMC Cart (AJAX + páginas)
 */
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::get('/cart/summary', [CartController::class, 'summary'])->name('cart.summary');
Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
Route::post('/cart/update', [CartController::class, 'update'])->name('cart.update');
Route::post('/cart/remove', [CartController::class, 'remove'])->name('cart.remove');
Route::post('/cart/clear', [CartController::class, 'clear'])->name('cart.clear');
'@

Ensure-TextInFile $routesPath "name('cart.add')" $cartRoutesBlock
Write-Ok "Routes de carrito aseguradas."

# Patch store layout with AJAX block
$storeLayout = Join-Path $ProjectRoot "resources\views\layouts\store.blade.php"
if (Test-Path -LiteralPath $storeLayout) {
  $c = Get-Content -LiteralPath $storeLayout -Raw

  # Ensure csrf meta
  if ($c -notmatch 'name="csrf-token"') {
    $c = [Regex]::Replace($c, "(<head[^>]*>)", "`$1`r`n    <meta name=`"csrf-token`" content=`"{{ csrf_token() }}`">", 1)
  }

  $start = "<!-- EMC_CART_AJAX_PATCH_v2 -->"
  $end   = "<!-- /EMC_CART_AJAX_PATCH_v2 -->"

  $patch = @'
<!-- EMC_CART_AJAX_PATCH_v2 -->
<script>
(function () {
  const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  const routes = {
    add: "{{ route('cart.add') }}",
    summary: "{{ route('cart.summary') }}",
    update: "{{ route('cart.update') }}",
    remove: "{{ route('cart.remove') }}",
    clear: "{{ route('cart.clear') }}"
  };

  function money(n) {
    try { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0)); }
    catch(e) { return '$' + (Number(n || 0).toFixed(2)); }
  }

  async function post(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrf,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload || {})
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || 'Error en la operación del carrito.';
      throw new Error(msg);
    }
    return data;
  }

  async function get(url) {
    const res = await fetch(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'No se pudo obtener resumen del carrito.');
    return data;
  }

  function ensureWidget() {
    if (document.getElementById('emc-cart-widget')) return;

    const div = document.createElement('div');
    div.id = 'emc-cart-widget';
    div.style.position = 'fixed';
    div.style.right = '16px';
    div.style.bottom = '16px';
    div.style.zIndex = '9999';
    div.innerHTML = `
      <a href="{{ route('cart.index') }}"
         style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:9999px;background:#111827;color:white;text-decoration:none;box-shadow:0 10px 15px rgba(0,0,0,.2)">
        <span style="font-size:18px">🛒</span>
        <span style="font-size:13px">Items: <b id="emc-cart-count">0</b></span>
        <span style="font-size:13px">Total: <b id="emc-cart-total">$0.00</b></span>
      </a>
    `;
    document.body.appendChild(div);
  }

  function paintSummary(data) {
    const countEl = document.getElementById('emc-cart-count');
    const totalEl = document.getElementById('emc-cart-total');
    if (countEl) countEl.textContent = String(data?.count ?? 0);
    if (totalEl) totalEl.textContent = money(data?.total ?? 0);
  }

  async function refresh() {
    ensureWidget();
    const s = await get(routes.summary);
    paintSummary(s);
  }

  async function addToCart(productoId, qty) {
    const data = await post(routes.add, { producto_id: Number(productoId), qty: qty ? Number(qty) : 1 });
    paintSummary(data);
  }

  // Bind buttons: cualquier elemento con data-add-to-cart="ID"
  function bind() {
    document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
      if (btn.dataset.emcBound === '1') return;
      btn.dataset.emcBound = '1';

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const pid = btn.getAttribute('data-add-to-cart');
        if (!pid) return;

        btn.setAttribute('disabled', 'disabled');
        try {
          await addToCart(pid, 1);
        } catch (err) {
          alert(err.message || 'No se pudo agregar al carrito');
        } finally {
          btn.removeAttribute('disabled');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      ensureWidget();
      bind();
      await refresh();
      // Re-bindeo por si hay paginación o contenido dinámico
      setInterval(bind, 1000);
    } catch (e) {
      // silencioso
    }
  });
})();
</script>
<!-- /EMC_CART_AJAX_PATCH_v2 -->
'@

  if ($c -match [Regex]::Escape($start) -and $c -match [Regex]::Escape($end)) {
    $c = [Regex]::Replace($c, "(?s)<!-- EMC_CART_AJAX_PATCH_v2 -->.*?<!-- /EMC_CART_AJAX_PATCH_v2 -->", $patch)
  } else {
    # Insert before </body> if exists
    if ($c -match "</body>") {
      $c = $c -replace "</body>", ($patch + "`r`n</body>")
    } else {
      if (-not $c.EndsWith("`n")) { $c += "`r`n" }
      $c += "`r`n" + $patch + "`r`n"
    }
  }

  Write-Utf8NoBomFile $storeLayout $c
  Write-Ok "store.blade.php parcheado (AJAX carrito completo, sin placeholders)."
} else {
  Write-Warn "No se encontró $storeLayout. Saltando parche de layout store."
}

# ---------------------------
# Seeder: productos de ejemplo (resistente a columnas faltantes)
# ---------------------------
$sampleSeederPath = Join-Path $ProjectRoot "database\seeders\EmcSampleProductosSeeder.php"
Backup-IfExists $sampleSeederPath

$sampleSeederPhp = @'
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EmcSampleProductosSeeder extends Seeder
{
    public function run(): void
    {
        if (!Schema::hasTable('productos')) {
            $this->command?->warn('No existe la tabla productos. Skip EmcSampleProductosSeeder.');
            return;
        }

        $cols = Schema::getColumnListing('productos');
        $now = now();

        $empresaId = Schema::hasTable('empresas') ? (DB::table('empresas')->value('id') ?? 1) : 1;
        $categoriaId = Schema::hasTable('categorias') ? (DB::table('categorias')->value('id') ?? 1) : 1;

        $samples = [
            ['nombre' => 'Tomate Saladette', 'precio' => 24.50, 'descripcion' => 'Tomate fresco para salsas y guisos.'],
            ['nombre' => 'Cebolla Blanca',    'precio' => 19.90, 'descripcion' => 'Cebolla blanca de primera.'],
            ['nombre' => 'Limón con semilla', 'precio' => 38.00, 'descripcion' => 'Limón para cocina y bebidas.'],
            ['nombre' => 'Aguacate Hass',     'precio' => 79.00, 'descripcion' => 'Aguacate maduración media.'],
            ['nombre' => 'Chile Jalapeño',    'precio' => 34.00, 'descripcion' => 'Ideal para salsas y encurtidos.'],
            ['nombre' => 'Papa Blanca',       'precio' => 22.00, 'descripcion' => 'Papa para freír o cocer.'],
        ];

        foreach ($samples as $p) {
            $row = [];

            if (in_array('empresa_id', $cols, true))  $row['empresa_id'] = $empresaId;
            if (in_array('categoria_id', $cols, true)) $row['categoria_id'] = $categoriaId;

            if (in_array('nombre', $cols, true)) $row['nombre'] = $p['nombre'];
            if (in_array('precio', $cols, true)) $row['precio'] = $p['precio'];
            if (in_array('descripcion', $cols, true)) $row['descripcion'] = $p['descripcion'];

            if (in_array('stock', $cols, true)) $row['stock'] = random_int(10, 200);
            if (in_array('activo', $cols, true)) $row['activo'] = true;

            // meta JSON (si existe)
            if (in_array('meta', $cols, true)) {
                $row['meta'] = json_encode([
                    'imagen_url' => '/images/producto-placeholder.svg',
                    'tags' => ['demo', 'abastos']
                ]);
            }

            if (in_array('created_at', $cols, true)) $row['created_at'] = $now;
            if (in_array('updated_at', $cols, true)) $row['updated_at'] = $now;

            // Evita duplicados por nombre (+empresa si existe)
            $where = [];
            if (in_array('nombre', $cols, true)) $where['nombre'] = $p['nombre'];
            if (in_array('empresa_id', $cols, true)) $where['empresa_id'] = $empresaId;

            if (!empty($where)) {
                DB::table('productos')->updateOrInsert($where, $row);
            } else {
                DB::table('productos')->insert($row);
            }
        }
    }
}
'@

Write-Utf8NoBomFile $sampleSeederPath $sampleSeederPhp
Write-Ok "Seeder de productos ejemplo creado: EmcSampleProductosSeeder"

# ---------------------------
# Migraciones + seed
# ---------------------------
Write-Info "Limpiando caches..."
Run "php artisan optimize:clear" $ProjectRoot

Write-Info "Migrando y seed base..."
Run "php artisan migrate:fresh --seed --force" $ProjectRoot

Write-Info "Insertando productos de ejemplo..."
Run "php artisan db:seed --class=Database\\Seeders\\EmcSampleProductosSeeder --force" $ProjectRoot

# ---------------------------
# Validaciones: lint + rutas + status
# ---------------------------
Write-Info "Validando sintaxis PHP (php -l) en archivos críticos..."
Run ("php -l `"{0}`"" -f $cartControllerPath) $ProjectRoot
if (Test-Path -LiteralPath $sampleSeederPath) { Run ("php -l `"{0}`"" -f $sampleSeederPath) $ProjectRoot }

Write-Info "Validando rutas (route:list)..."
Run "php artisan route:list" $ProjectRoot | Out-Null

Write-Info "Validando migraciones (migrate:status)..."
Run "php artisan migrate:status" $ProjectRoot | Out-Null

Write-Ok "=== LISTO ==="
Write-Ok ("Proyecto en: {0}" -f $ProjectRoot)
Write-Ok ("DB (Postgres): 127.0.0.1:{0}  DB={1} USER={2}" -f $PgPort, $DbName, $DbUser)
Write-Ok ("Para levantar el server:  cd `"{0}`" ; php artisan serve --host=127.0.0.1 --port={1}" -f $ProjectRoot, $AppPort)

Write-Warn "Nota pago (MercadoPago): revisa tus variables en .env (tokens/keys). Para producción usa QUEUE_CONNECTION=database + worker."
