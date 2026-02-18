@extends('layouts.storefront')

@section('content')
<!-- Hero Slider -->
<x-storefront.hero-slider :flyers="$flyers ?? collect()" />

<!-- Search & Filters Section -->
<section id="productos" class="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
    <div class="max-w-7xl mx-auto">
        <!-- Search Bar -->
        <div class="bg-white rounded-2xl shadow-premium p-4 lg:p-6 mb-8 lg:mb-12">
            <form method="GET" class="flex flex-col lg:flex-row gap-4">
                <!-- Search Input -->
                <div class="flex-1 relative">
                    <input type="text"
                           name="q"
                           value="{{ $q }}"
                           placeholder="Buscar productos..."
                           class="w-full pl-12 pr-4 py-4 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all bg-slate-50 focus:bg-white">
                    <svg class="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>

                <!-- Category Select -->
                <select name="categoria_id"
                        class="px-4 py-4 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all bg-slate-50 focus:bg-white min-w-[200px]">
                    <option value="">Todas las categorias</option>
                    @foreach($categorias as $cat)
                        <option value="{{ $cat->id }}" {{ $categoriaId == $cat->id ? 'selected' : '' }}>
                            {{ $cat->nombre }}
                        </option>
                    @endforeach
                </select>

                <!-- Search Button -->
                <button type="submit"
                        class="px-8 py-4 rounded-xl font-semibold text-white transition-all hover-lift flex items-center justify-center gap-2 text-lg"
                        style="background-color: var(--brand-primary);">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <span class="hidden sm:inline">Buscar</span>
                </button>
            </form>
        </div>

        <!-- Results Header -->
        @if($q || $categoriaId)
            <div class="mb-6 flex items-center justify-between">
                <p class="text-slate-600">
                    <span class="font-semibold text-slate-800">{{ $productos->total() }}</span> productos encontrados
                    @if($q)<span class="text-slate-500">para "{{ $q }}"</span>@endif
                </p>
                <a href="{{ route('store.home') }}" class="text-sm font-medium hover:underline" style="color: var(--brand-primary);">
                    Limpiar filtros
                </a>
            </div>
        @endif

        <!-- Products Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            @forelse($productos as $index => $producto)
                <x-storefront.product-card :producto="$producto" :lazy="$index > 3" />
            @empty
                <div class="col-span-full text-center py-16 lg:py-24">
                    <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                        </svg>
                    </div>
                    <h3 class="font-heading text-2xl font-bold text-slate-800 mb-2">No hay productos disponibles</h3>
                    <p class="text-slate-500 mb-6">Intenta con otra busqueda o categoria</p>
                    <a href="{{ route('store.home') }}"
                       class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover-lift"
                       style="background-color: var(--brand-primary);">
                        Ver todos los productos
                    </a>
                </div>
            @endforelse
        </div>

        <!-- Pagination -->
        @if($productos->hasPages())
            <div class="mt-12">
                {{ $productos->links() }}
            </div>
        @endif
    </div>
</section>

<!-- Features Section -->
<section class="w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16 bg-white">
    <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Feature 1 -->
            <div class="text-center p-6">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                     style="background-color: color-mix(in srgb, var(--brand-primary) 15%, white);">
                    <svg class="w-8 h-8" style="color: var(--brand-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <h3 class="font-heading text-xl font-bold text-slate-800 mb-2">Productos Frescos</h3>
                <p class="text-slate-600">Seleccion diaria de los mejores productos del mercado</p>
            </div>

            <!-- Feature 2 -->
            <div class="text-center p-6">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                     style="background-color: color-mix(in srgb, var(--brand-primary) 15%, white);">
                    <svg class="w-8 h-8" style="color: var(--brand-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h3 class="font-heading text-xl font-bold text-slate-800 mb-2">Mejores Precios</h3>
                <p class="text-slate-600">Precios competitivos directo del productor</p>
            </div>

            <!-- Feature 3 -->
            <div class="text-center p-6">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                     style="background-color: color-mix(in srgb, var(--brand-primary) 15%, white);">
                    <svg class="w-8 h-8" style="color: var(--brand-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <h3 class="font-heading text-xl font-bold text-slate-800 mb-2">Entrega Rapida</h3>
                <p class="text-slate-600">Recibe tu pedido el mismo dia o recoge en tienda</p>
            </div>
        </div>
    </div>
</section>
@endsection
