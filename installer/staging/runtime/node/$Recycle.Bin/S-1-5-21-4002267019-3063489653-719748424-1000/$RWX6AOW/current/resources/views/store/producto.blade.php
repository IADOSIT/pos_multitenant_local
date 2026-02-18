@extends('layouts.storefront', ['title' => $producto->nombre])

@php
    $imageUrl = $producto->display_image ?? '/images/producto-default.svg';
    $fallback = '/images/producto-default.svg';
@endphp

@section('content')
<div class="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
    <div class="max-w-7xl mx-auto">
        <!-- Breadcrumb -->
        <nav class="mb-6 lg:mb-8">
            <ol class="flex items-center gap-2 text-sm">
                <li>
                    <a href="{{ route('store.home') }}" class="text-slate-500 hover:text-slate-700 transition-colors">
                        Tienda
                    </a>
                </li>
                <li class="text-slate-400">/</li>
                @if($producto->categoria)
                    <li>
                        <a href="{{ route('store.home', ['categoria_id' => $producto->categoria_id]) }}"
                           class="text-slate-500 hover:text-slate-700 transition-colors">
                            {{ $producto->categoria->nombre }}
                        </a>
                    </li>
                    <li class="text-slate-400">/</li>
                @endif
                <li class="text-slate-800 font-medium truncate max-w-[200px]">{{ $producto->nombre }}</li>
            </ol>
        </nav>

        <!-- Product Details -->
        <div class="bg-white rounded-2xl shadow-premium overflow-hidden">
            <div class="grid lg:grid-cols-2 gap-0">
                <!-- Product Image -->
                <div class="relative bg-slate-100 aspect-square lg:aspect-auto lg:min-h-[500px]">
                    <img src="{{ $imageUrl }}"
                         alt="{{ $producto->nombre }}"
                         class="w-full h-full object-cover"
                         loading="eager"
                         width="600"
                         height="600"
                         onerror="this.onerror=null; this.src='{{ $fallback }}';">

                    @if($producto->categoria)
                        <span class="absolute top-4 left-4 px-4 py-2 text-sm font-semibold rounded-full bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                            {{ $producto->categoria->nombre }}
                        </span>
                    @endif
                </div>

                <!-- Product Info -->
                <div class="p-6 lg:p-10 flex flex-col" x-data="{ qty: 1, adding: false }">
                    <div class="flex-1">
                        <h1 class="font-heading text-3xl lg:text-4xl font-bold text-slate-800 leading-tight">
                            {{ $producto->nombre }}
                        </h1>

                        @if($producto->categoria)
                            <p class="mt-2 text-slate-500">{{ $producto->categoria->nombre }}</p>
                        @endif

                        <!-- Price -->
                        <div class="mt-6 flex items-baseline gap-3">
                            <span class="text-4xl lg:text-5xl font-bold" style="color: var(--brand-primary);">
                                ${{ number_format($producto->precio, 2) }}
                            </span>
                            @if($producto->unidad)
                                <span class="text-xl text-slate-500">/ {{ $producto->unidad }}</span>
                            @endif
                        </div>

                        <!-- Description -->
                        @if($producto->descripcion)
                            <div class="mt-6 pt-6 border-t border-slate-200">
                                <h2 class="font-heading text-lg font-semibold text-slate-800 mb-2">Descripcion</h2>
                                <p class="text-slate-600 leading-relaxed">{{ $producto->descripcion }}</p>
                            </div>
                        @endif
                    </div>

                    <!-- Add to Cart Form -->
                    <div class="mt-8 pt-6 border-t border-slate-200">
                        <!-- Quantity Selector -->
                        <div class="flex items-center gap-4 mb-6">
                            <label class="text-slate-700 font-medium">Cantidad:</label>
                            <div class="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                                <button type="button"
                                        @click="qty = Math.max(1, qty - 1)"
                                        class="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                    </svg>
                                </button>
                                <input type="number"
                                       x-model="qty"
                                       min="1"
                                       max="99"
                                       class="w-16 h-12 text-center border-0 bg-transparent font-semibold text-lg focus:ring-0">
                                <button type="button"
                                        @click="qty = Math.min(99, qty + 1)"
                                        class="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Add to Cart Button -->
                        <button type="button"
                                @click="adding = true; addToCart({{ $producto->id }}, qty, $el).finally(() => adding = false)"
                                :disabled="adding"
                                class="w-full py-4 rounded-xl font-semibold text-white text-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70"
                                style="background-color: var(--brand-primary);"
                                :class="adding ? '' : 'hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'">
                            <template x-if="!adding">
                                <span class="flex items-center gap-3">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                    Agregar al carrito
                                </span>
                            </template>
                            <template x-if="adding">
                                <span class="flex items-center gap-3">
                                    <svg class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Agregando...
                                </span>
                            </template>
                        </button>

                        <!-- Continue Shopping -->
                        <a href="{{ route('store.home') }}"
                           class="mt-4 w-full py-3 rounded-xl font-medium text-slate-700 border-2 border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                            Seguir comprando
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Trust Badges -->
        <div class="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: color-mix(in srgb, var(--brand-primary) 15%, white);">
                    <svg class="w-5 h-5" style="color: var(--brand-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <span class="text-sm text-slate-700 font-medium">Producto fresco</span>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: color-mix(in srgb, var(--brand-primary) 15%, white);">
                    <svg class="w-5 h-5" style="color: var(--brand-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                </div>
                <span class="text-sm text-slate-700 font-medium">Compra segura</span>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: color-mix(in srgb, var(--brand-primary) 15%, white);">
                    <svg class="w-5 h-5" style="color: var(--brand-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <span class="text-sm text-slate-700 font-medium">Entrega rapida</span>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: color-mix(in srgb, var(--brand-primary) 15%, white);">
                    <svg class="w-5 h-5" style="color: var(--brand-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                </div>
                <span class="text-sm text-slate-700 font-medium">Soporte WhatsApp</span>
            </div>
        </div>
    </div>
</div>
@endsection
