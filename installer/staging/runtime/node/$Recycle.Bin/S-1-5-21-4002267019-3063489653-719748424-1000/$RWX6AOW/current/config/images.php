<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Auto Image Fetching
    |--------------------------------------------------------------------------
    |
    | Enable/disable automatic image fetching for products
    |
    */
    'auto_fetch' => env('IMAGES_AUTO_FETCH', true),

    /*
    |--------------------------------------------------------------------------
    | Image Source
    |--------------------------------------------------------------------------
    |
    | Source for auto images: 'unsplash', 'pexels', 'placeholder'
    |
    */
    'source' => env('IMAGES_SOURCE', 'unsplash'),

    /*
    |--------------------------------------------------------------------------
    | Default Image
    |--------------------------------------------------------------------------
    |
    | Default image when no other image is available
    |
    */
    'default' => env('IMAGES_DEFAULT', '/images/producto-default.svg'),

    /*
    |--------------------------------------------------------------------------
    | Cache Duration
    |--------------------------------------------------------------------------
    |
    | Hours to cache auto-fetched images
    |
    */
    'cache_hours' => env('IMAGES_CACHE_HOURS', 24),
];
