<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Public\PortalController;

/*
|--------------------------------------------------------------------------
| Public API Routes (no auth required)
|--------------------------------------------------------------------------
*/

Route::prefix('public')->name('api.public.')->group(function () {
    // Portal configuration
    Route::get('portal-config', [PortalController::class, 'config'])->name('portal.config');

    // Stores directory
    Route::get('stores', [PortalController::class, 'stores'])->name('stores');
    Route::get('stores/{handle}', [PortalController::class, 'store'])->name('stores.show');
    Route::get('stores/{handle}/products', [PortalController::class, 'storeProducts'])->name('stores.products');
    Route::get('stores/{handle}/products/{productId}', [PortalController::class, 'storeProduct'])->name('stores.products.show');

    // Promotions for portal
    Route::get('promotions', [PortalController::class, 'promotions'])->name('promotions');

    // Products catalog
    Route::get('products', [PortalController::class, 'products'])->name('products');

    // Flyer/banner products
    Route::get('flyer', [PortalController::class, 'flyer'])->name('flyer');
});
