<?php

use Illuminate\Support\ServiceProvider;

return [

    'name' => env('APP_NAME', 'EMC Abastos'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),

    'timezone' => env('APP_TIMEZONE', 'America/Monterrey'),
    'locale' => env('APP_LOCALE', 'es'),
    'fallback_locale' => 'en',
    'faker_locale' => 'es_MX',

    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',

    /*
    |--------------------------------------------------------------------------
    | Autoloaded Service Providers
    |--------------------------------------------------------------------------
    | In Laravel 11, core providers come from defaultProviders(). We only add
    | our application providers here.
    */
    'providers' => ServiceProvider::defaultProviders()->merge([
        App\Providers\AppServiceProvider::class,
        App\Providers\AuthServiceProvider::class,
        App\Providers\RouteServiceProvider::class,
    ])->toArray(),

];
