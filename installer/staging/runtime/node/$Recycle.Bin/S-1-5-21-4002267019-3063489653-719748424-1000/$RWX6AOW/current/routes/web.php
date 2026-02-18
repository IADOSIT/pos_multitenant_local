<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ProductosController;
use App\Http\Controllers\Admin\CategoriasController;
use App\Http\Controllers\Admin\CajaController;
use App\Http\Controllers\Admin\WhatsAppController;
use App\Http\Controllers\Admin\InventariosController;
use App\Http\Controllers\Admin\ClientesController;
use App\Http\Controllers\Admin\EmpresasController;
use App\Http\Controllers\Admin\UsuariosController;
use App\Http\Controllers\Admin\TemasController;
use App\Http\Controllers\Admin\PagosController;
use App\Http\Controllers\Operaciones\OrdenesController;
use App\Http\Controllers\Operaciones\OpsHubController;
use App\Http\Controllers\Operaciones\WhatsAppRetryController;
use App\Http\Controllers\Webhooks\MercadoPagoController;
use App\Http\Controllers\AI\HelpController;
use App\Http\Controllers\Admin\PortalConfigController;
use App\Http\Controllers\Admin\StoreDomainsController;
use App\Http\Controllers\Admin\StorePromotionsController;

// Home redirect (configurable via PortalConfig)
Route::get('/', function () {
    $path = \App\Models\PortalConfig::get('home_redirect_path', 'portal');
    return redirect('/' . ltrim($path, '/'));
})->name('home.redirect');

// Storefront (main domain)
Route::get('/portal', [StoreController::class, 'index'])->name('store.home');
Route::get('/producto/{producto}', [StoreController::class, 'show'])->name('store.producto');

// Cart
Route::get('/carrito', [CartController::class, 'index'])->name('cart.index');
Route::post('/carrito/agregar', [CartController::class, 'add'])->name('cart.add');
Route::post('/carrito/actualizar', [CartController::class, 'update'])->name('cart.update');
Route::post('/carrito/eliminar', [CartController::class, 'remove'])->name('cart.remove');
Route::post('/carrito/vaciar', [CartController::class, 'clear'])->name('cart.clear');
Route::get('/carrito/resumen', [CartController::class, 'summary'])->name('cart.summary');

// Checkout
Route::get('/checkout', [CheckoutController::class, 'show'])->name('checkout.show');
Route::post('/checkout', [CheckoutController::class, 'place'])->name('checkout.place');
Route::get('/checkout/success/{folio}', [CheckoutController::class, 'success'])->name('checkout.success');
Route::get('/checkout/failure/{folio}', [CheckoutController::class, 'failure'])->name('checkout.failure');
Route::get('/checkout/pending/{folio}', [CheckoutController::class, 'pending'])->name('checkout.pending');

// Track Order & Thanks
Route::get('/pedido/{folio}', [StoreController::class, 'track'])->name('store.track');
Route::get('/gracias/{folio}', [StoreController::class, 'thanks'])->name('store.thanks');

// Auth
Route::get('/login', [LoginController::class, 'show'])->name('login');
Route::post('/login', [LoginController::class, 'login'])->name('login.post');
Route::post('/login/empresas', [LoginController::class, 'getEmpresas'])->name('login.empresas');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// Registration
Route::get('/registro', [RegisterController::class, 'show'])->name('register');
Route::post('/registro', [RegisterController::class, 'register'])->name('register.post');

// Password Reset
use App\Http\Controllers\Auth\PasswordResetController;
Route::get('/password/reset', [PasswordResetController::class, 'showRequestForm'])->name('password.request');
Route::post('/password/email', [PasswordResetController::class, 'sendResetLink'])->name('password.email');
Route::get('/password/reset/{token}', [PasswordResetController::class, 'showResetForm'])->name('password.reset');
Route::post('/password/reset', [PasswordResetController::class, 'reset'])->name('password.update');

// Empresa Switch
Route::get('/empresa', function () {
    return redirect()->route(auth()->check() ? 'admin.dashboard' : 'login');
})->name('empresa.switch');
Route::post('/empresa', [HomeController::class, 'empresaSet'])->middleware('auth')->name('empresa.set');

// Storefront by Handle (fallback URL: /t/{handle})
Route::prefix('t/{handle}')->middleware('store.resolve')->group(function () {
    Route::get('/', [StoreController::class, 'index'])->name('store.handle.home');
    Route::get('/producto/{producto}', [StoreController::class, 'show'])->name('store.handle.producto');
    Route::get('/carrito', [CartController::class, 'index'])->name('store.handle.cart');
    Route::post('/carrito/agregar', [CartController::class, 'add'])->name('store.handle.cart.add');
    Route::get('/checkout', [CheckoutController::class, 'show'])->name('store.handle.checkout');
    Route::post('/checkout', [CheckoutController::class, 'place'])->name('store.handle.checkout.place');
});

// Webhooks (no auth required)
Route::post('/webhooks/mercadopago', [MercadoPagoController::class, 'handle'])->name('webhooks.mercadopago');

// Generic dashboard redirect
Route::get('/dashboard', function () {
    return redirect()->route('admin.dashboard');
})->middleware(['auth', 'empresa'])->name('dashboard');

// Ops Routes
Route::prefix('ops')->name('ops.')->middleware(['auth', 'empresa', 'role:operaciones,admin_empresa,superadmin'])->group(function () {
    Route::get('/', [OpsHubController::class, 'index'])->name('hub');
    Route::get('ordenes', [OrdenesController::class, 'index'])->name('ordenes.index');
    Route::get('ordenes/hoy', [OrdenesController::class, 'hoy'])->name('ordenes.hoy');
    Route::get('ordenes/{id}', [OrdenesController::class, 'show'])->name('ordenes.show');
    Route::post('ordenes/{id}/status', [OrdenesController::class, 'updateStatus'])->name('ordenes.updateStatus');
    Route::post('ordenes/{id}/pagos', [OrdenesController::class, 'storePago'])->name('pagos.store');
    Route::get('whatsapp', [WhatsAppRetryController::class, 'index'])->name('whatsapp.index');
    Route::post('whatsapp/{logId}/retry', [WhatsAppRetryController::class, 'retry'])->name('whatsapp.retry');
    Route::post('whatsapp/orden/{ordenId}/retry-last', [WhatsAppRetryController::class, 'retryLast'])->name('whatsapp.retryLast');
    Route::post('whatsapp/orden/{ordenId}/optout', [WhatsAppRetryController::class, 'optout'])->name('whatsapp.optout');
});

// Admin Routes
Route::prefix('admin')->name('admin.')->middleware(['auth', 'empresa', 'role:admin_empresa,superadmin'])->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/chart-data', [AdminDashboardController::class, 'chartData'])->name('chart-data');

    // Superadmin only routes
    Route::middleware('role:superadmin')->group(function () {
        // Portal Config
        Route::get('portal', [PortalConfigController::class, 'index'])->name('portal.config');
        Route::post('portal', [PortalConfigController::class, 'update'])->name('portal.config.update');

        // Empresas CRUD
        Route::resource('empresas', EmpresasController::class)->except(['show']);

        // Store Domains
        Route::get('empresas/{empresa}/domains', [StoreDomainsController::class, 'index'])->name('empresas.domains');
        Route::post('empresas/{empresa}/domains', [StoreDomainsController::class, 'store'])->name('empresas.domains.store');
        Route::put('empresas/{empresa}/domains/{domain}', [StoreDomainsController::class, 'update'])->name('empresas.domains.update');
        Route::delete('empresas/{empresa}/domains/{domain}', [StoreDomainsController::class, 'destroy'])->name('empresas.domains.destroy');

        // Temas/Plantillas CRUD
        Route::resource('temas', TemasController::class)->except(['show']);
        Route::get('temas/{id}/preview', [TemasController::class, 'preview'])->name('temas.preview');
    });

    // Promotions (admin can manage their store's promos)
    Route::resource('promotions', StorePromotionsController::class)->except(['show']);
    Route::post('promotions/{promotion}/toggle', [StorePromotionsController::class, 'toggle'])->name('promotions.toggle');

    // Usuarios CRUD
    Route::resource('usuarios', UsuariosController::class)->except(['show']);
    Route::post('usuarios/{id}/reset-password', [UsuariosController::class, 'resetPassword'])->name('usuarios.resetPassword');
    Route::post('usuarios/{id}/toggle', [UsuariosController::class, 'toggle'])->name('usuarios.toggle');

    // Pagos
    Route::get('pagos', [PagosController::class, 'index'])->name('pagos.index');
    Route::get('pagos/{id}', [PagosController::class, 'show'])->name('pagos.show');
    Route::post('pagos/{id}/refresh', [PagosController::class, 'refresh'])->name('pagos.refresh');

    Route::resource('productos', ProductosController::class)->except(['show']);
    Route::post('productos/{id}/toggle-featured', [ProductosController::class, 'toggleFeatured'])->name('productos.toggleFeatured');
    Route::resource('categorias', CategoriasController::class)->except(['show']);

    // Caja
    Route::get('caja', [CajaController::class, 'index'])->name('caja.index');
    Route::post('caja/abrir', [CajaController::class, 'abrir'])->name('caja.abrir');
    Route::post('caja/{turno}/cerrar', [CajaController::class, 'cerrar'])->name('caja.cerrar');
    Route::get('caja/history', [CajaController::class, 'history'])->name('caja.history');
    Route::get('caja/{turno}', [CajaController::class, 'turno'])->name('caja.turno');
    Route::post('caja/{turno}/movimiento', [CajaController::class, 'movimiento'])->name('caja.movimiento');

    Route::resource('whatsapp', WhatsAppController::class)->only(['index', 'create', 'store', 'destroy']);
    Route::post('whatsapp/{id}/toggle', [WhatsAppController::class, 'toggle'])->name('whatsapp.toggle');
    Route::get('inventarios', [InventariosController::class, 'index'])->name('inventarios.index');
    Route::get('inventarios/{productoId}/kardex', [InventariosController::class, 'kardex'])->name('inventarios.kardex');
    Route::post('inventarios/{productoId}/ajustar', [InventariosController::class, 'ajustar'])->name('inventarios.ajustar');
    Route::resource('clientes', ClientesController::class)->except(['show']);
    Route::post('clientes/{id}/toggle', [ClientesController::class, 'toggle'])->name('clientes.toggle');
    Route::resource('flyers', \App\Http\Controllers\Admin\FlyersController::class)->except(['show']);
    Route::post('flyers/reorder', [\App\Http\Controllers\Admin\FlyersController::class, 'reorder'])->name('flyers.reorder');

    // AI Help Assistant
    Route::get('ayuda', [HelpController::class, 'index'])->name('ai.help');
    Route::post('ayuda/ask', [HelpController::class, 'ask'])->name('ai.ask');

    // Import/Export Hub
    Route::get('import-export', [\App\Http\Controllers\Admin\ImportExportController::class, 'hub'])->name('import-export.hub');
    Route::get('import-export/history', [\App\Http\Controllers\Admin\ImportExportController::class, 'history'])->name('import-export.history');

    // Import/Export - Productos
    Route::get('import-export/productos', [\App\Http\Controllers\Admin\ImportExportController::class, 'productosIndex'])->name('import-export.productos');
    Route::get('import-export/productos/template', [\App\Http\Controllers\Admin\ImportExportController::class, 'productosTemplate'])->name('import-export.productos.template');
    Route::post('import-export/productos/preview', [\App\Http\Controllers\Admin\ImportExportController::class, 'productosPreview'])->name('import-export.productos.preview');
    Route::post('import-export/productos/import', [\App\Http\Controllers\Admin\ImportExportController::class, 'productosImport'])->name('import-export.productos.import');
    Route::get('import-export/productos/export', [\App\Http\Controllers\Admin\ImportExportController::class, 'productosExport'])->name('import-export.productos.export');

    // Import/Export - Categorias
    Route::get('import-export/categorias', [\App\Http\Controllers\Admin\ImportExportController::class, 'categoriasIndex'])->name('import-export.categorias');
    Route::get('import-export/categorias/template', [\App\Http\Controllers\Admin\ImportExportController::class, 'categoriasTemplate'])->name('import-export.categorias.template');
    Route::post('import-export/categorias/import', [\App\Http\Controllers\Admin\ImportExportController::class, 'categoriasImport'])->name('import-export.categorias.import');
    Route::get('import-export/categorias/export', [\App\Http\Controllers\Admin\ImportExportController::class, 'categoriasExport'])->name('import-export.categorias.export');

    // Import/Export - Clientes
    Route::get('import-export/clientes', [\App\Http\Controllers\Admin\ImportExportController::class, 'clientesIndex'])->name('import-export.clientes');
    Route::get('import-export/clientes/template', [\App\Http\Controllers\Admin\ImportExportController::class, 'clientesTemplate'])->name('import-export.clientes.template');
    Route::post('import-export/clientes/preview', [\App\Http\Controllers\Admin\ImportExportController::class, 'clientesPreview'])->name('import-export.clientes.preview');
    Route::post('import-export/clientes/import', [\App\Http\Controllers\Admin\ImportExportController::class, 'clientesImport'])->name('import-export.clientes.import');
    Route::get('import-export/clientes/export', [\App\Http\Controllers\Admin\ImportExportController::class, 'clientesExport'])->name('import-export.clientes.export');

    // Import/Export - Inventario
    Route::get('import-export/inventario', [\App\Http\Controllers\Admin\ImportExportController::class, 'inventarioIndex'])->name('import-export.inventario');
    Route::get('import-export/inventario/template', [\App\Http\Controllers\Admin\ImportExportController::class, 'inventarioTemplate'])->name('import-export.inventario.template');
    Route::post('import-export/inventario/preview', [\App\Http\Controllers\Admin\ImportExportController::class, 'inventarioPreview'])->name('import-export.inventario.preview');
    Route::post('import-export/inventario/import', [\App\Http\Controllers\Admin\ImportExportController::class, 'inventarioImport'])->name('import-export.inventario.import');
    Route::get('import-export/inventario/export', [\App\Http\Controllers\Admin\ImportExportController::class, 'inventarioExport'])->name('import-export.inventario.export');
});
