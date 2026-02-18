@extends('layouts.storefront', ['title' => 'Mi Carrito'])

@section('content')
<div class="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
    <div class="max-w-7xl mx-auto">
        <h1 class="font-heading text-3xl lg:text-4xl font-bold text-slate-800 mb-8">Mi Carrito</h1>

        @php $storeHome = $empresa && $empresa->handle ? '/t/' . $empresa->handle : route('store.home'); @endphp

        @if(!empty($items))
            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Cart Items -->
                <div class="lg:col-span-2 space-y-4">
                    @foreach($items as $it)
                        @php
                            $itemImage = $it['producto']->display_image ?? '/images/producto-default.svg';
                        @endphp
                        <div class="bg-white rounded-2xl shadow-premium p-4 lg:p-6 flex gap-4 lg:gap-6" x-data="{ qty: {{ $it['qty'] }} }">
                            <!-- Product Image -->
                            <div class="w-24 h-24 lg:w-32 lg:h-32 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden">
                                <img src="{{ $itemImage }}"
                                     alt="{{ $it['producto']->nombre }}"
                                     class="w-full h-full object-cover"
                                     loading="lazy"
                                     width="128"
                                     height="128"
                                     onerror="this.onerror=null; this.src='/images/producto-default.svg';">
                            </div>

                            <!-- Product Info -->
                            <div class="flex-1 flex flex-col">
                                <div class="flex-1">
                                    <a href="{{ route('store.producto', $it['producto']) }}"
                                       class="font-heading font-semibold text-lg text-slate-800 hover:text-[var(--brand-primary)] transition-colors">
                                        {{ $it['producto']->nombre }}
                                    </a>
                                    <p class="text-lg font-bold mt-1" style="color: var(--brand-primary);">
                                        ${{ number_format($it['producto']->precio, 2) }}
                                    </p>
                                </div>

                                <!-- Quantity Controls -->
                                <form method="POST" action="{{ route('cart.update') }}" class="mt-4 flex flex-wrap items-center gap-4">
                                    @csrf
                                    <input type="hidden" name="producto_id" value="{{ $it['producto']->id }}">
                                    <div class="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                                        <button type="button"
                                                @click="qty = Math.max(0, qty - 1)"
                                                class="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                            </svg>
                                        </button>
                                        <input type="number"
                                               name="qty"
                                               x-model="qty"
                                               min="0"
                                               max="99"
                                               class="w-14 h-10 text-center border-0 bg-transparent font-semibold focus:ring-0">
                                        <button type="button"
                                                @click="qty = Math.min(99, qty + 1)"
                                                class="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <button type="submit"
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                            style="background-color: color-mix(in srgb, var(--brand-primary) 15%, white); color: var(--brand-primary);">
                                        Actualizar
                                    </button>
                                </form>
                            </div>

                            <!-- Subtotal -->
                            <div class="text-right hidden sm:block">
                                <p class="text-sm text-slate-500 mb-1">Subtotal</p>
                                <p class="font-heading font-bold text-xl text-slate-800">
                                    ${{ number_format($it['producto']->precio * $it['qty'], 2) }}
                                </p>
                            </div>
                        </div>
                    @endforeach

                    <!-- Clear Cart -->
                    <div class="flex justify-between items-center pt-4">
                        <a href="{{ $storeHome }}"
                           class="text-slate-600 hover:text-slate-800 font-medium flex items-center gap-2 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                            Seguir comprando
                        </a>
                        <form method="POST" action="{{ route('cart.clear') }}">
                            @csrf
                            <button type="submit"
                                    class="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                                Vaciar carrito
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Order Summary (Sticky) -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-2xl shadow-premium p-6 lg:p-8 sticky top-24">
                        <h2 class="font-heading text-xl font-bold text-slate-800 mb-6">Resumen del pedido</h2>

                        <div class="space-y-4 text-sm">
                            <div class="flex justify-between">
                                <span class="text-slate-600">Subtotal ({{ count($items) }} productos)</span>
                                <span class="font-semibold text-slate-800">${{ number_format($total, 2) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-600">Envio</span>
                                <span class="font-medium" style="color: var(--brand-primary);">Por calcular</span>
                            </div>
                            <div class="border-t border-slate-200 pt-4 mt-4">
                                <div class="flex justify-between items-center">
                                    <span class="font-heading text-lg font-bold text-slate-800">Total</span>
                                    <span class="font-heading text-2xl font-bold" style="color: var(--brand-primary);">
                                        ${{ number_format($total, 2) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-8 space-y-3">
                            <a href="{{ route('checkout.show') }}"
                               class="block w-full py-4 rounded-xl font-semibold text-white text-center text-lg transition-all hover-lift"
                               style="background-color: var(--brand-primary);">
                                Proceder al pago
                            </a>
                            <a href="{{ $storeHome }}"
                               class="block w-full py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 text-center rounded-xl font-medium transition-all">
                                Seguir comprando
                            </a>
                        </div>

                        <!-- Trust Badges -->
                        <div class="mt-8 pt-6 border-t border-slate-200 space-y-3">
                            <div class="flex items-center gap-3 text-sm text-slate-600">
                                <svg class="w-5 h-5 flex-shrink-0" style="color: var(--brand-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                                <span>Compra segura garantizada</span>
                            </div>
                            <div class="flex items-center gap-3 text-sm text-slate-600">
                                <svg class="w-5 h-5 flex-shrink-0" style="color: var(--brand-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                </svg>
                                <span>Soporte por WhatsApp</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        @else
            <!-- Empty Cart -->
            <div class="text-center py-16 lg:py-24">
                <div class="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg class="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                </div>
                <h2 class="font-heading text-3xl font-bold text-slate-800 mb-3">Tu carrito esta vacio</h2>
                <p class="text-slate-500 text-lg mb-8 max-w-md mx-auto">
                    Agrega productos para comenzar tu compra. Tenemos los mejores productos al mejor precio.
                </p>
                <a href="{{ $storeHome }}"
                   class="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover-lift"
                   style="background-color: var(--brand-primary);">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    Ver productos
                </a>
            </div>
        @endif
    </div>
</div>
@endsection
