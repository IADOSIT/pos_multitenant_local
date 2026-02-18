@props(['producto', 'lazy' => true])

@php
    $imageUrl = $producto->display_image ?? '/images/producto-default.svg';
    $placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Cg fill='%239ca3af'%3E%3Crect x='160' y='140' width='80' height='80' rx='8'/%3E%3Cpath d='M175 165 L185 155 L205 175 L215 165 L225 185 L175 185 Z' fill='%23d1d5db'/%3E%3Ccircle cx='185' cy='160' r='8' fill='%23d1d5db'/%3E%3C/g%3E%3C/svg%3E";
@endphp

<article class="group bg-white rounded-2xl shadow-premium overflow-hidden hover-lift"
         x-data="{ qty: 1, adding: false }">
    <!-- Product Image -->
    <a href="{{ route('store.producto', $producto) }}"
       class="block aspect-product bg-slate-100 relative overflow-hidden">
        <img src="{{ $imageUrl }}"
             alt="{{ $producto->nombre }}"
             class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
             loading="{{ $lazy ? 'lazy' : 'eager' }}"
             width="400"
             height="400"
             onerror="this.onerror=null; this.src='{{ $placeholderSvg }}';">

        <!-- Category Badge -->
        @if($producto->categoria)
            <span class="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                {{ $producto->categoria->nombre }}
            </span>
        @endif

        <!-- Quick View Overlay -->
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 py-2 bg-white rounded-xl font-semibold text-sm text-slate-800 shadow-lg transform translate-y-2 group-hover:translate-y-0">
                Ver detalles
            </span>
        </div>
    </a>

    <!-- Product Info -->
    <div class="p-4 lg:p-5">
        <a href="{{ route('store.producto', $producto) }}" class="block">
            <h3 class="font-heading font-semibold text-slate-800 group-hover:text-[var(--brand-primary)] transition-colors line-clamp-2 min-h-[2.5rem]">
                {{ $producto->nombre }}
            </h3>
        </a>

        <!-- Price -->
        <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-bold" style="color: var(--brand-primary);">
                ${{ number_format($producto->precio, 2) }}
            </span>
            @if($producto->unidad)
                <span class="text-sm text-slate-500">/ {{ $producto->unidad }}</span>
            @endif
        </div>

        <!-- Quantity Selector -->
        <div class="mt-4 flex items-center gap-2">
            <div class="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                <button type="button"
                        @click="qty = Math.max(1, qty - 1)"
                        class="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                    </svg>
                </button>
                <span class="w-10 text-center font-semibold text-slate-800" x-text="qty">1</span>
                <button type="button"
                        @click="qty = Math.min(99, qty + 1)"
                        class="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Add to Cart Button -->
        <button type="button"
                @click="adding = true; addToCart({{ $producto->id }}, qty, $el).finally(() => adding = false)"
                :disabled="adding"
                class="mt-4 w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                style="background-color: var(--brand-primary);"
                :class="adding ? '' : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'">
            <template x-if="!adding">
                <span class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    Agregar
                </span>
            </template>
            <template x-if="adding">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
            </template>
        </button>
    </div>
</article>
