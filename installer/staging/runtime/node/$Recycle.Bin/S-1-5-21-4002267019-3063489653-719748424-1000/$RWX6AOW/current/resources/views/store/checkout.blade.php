@extends('layouts.storefront', ['title' => 'Finalizar Compra'])

@php
    $empresaId = (int) session('empresa_id', 0);
    $fullCart = session('cart', []);
    $cart = $fullCart[$empresaId] ?? [];
    $items = [];
    $total = 0;
    if (!empty($cart)) {
        $productos = \App\Models\Producto::whereIn('id', array_keys($cart))->get()->keyBy('id');
        foreach ($cart as $pid => $data) {
            $p = $productos->get((int)$pid);
            if (!$p) continue;
            $qty = is_array($data) ? ($data['qty'] ?? 1) : (int)$data;
            $items[] = ['producto' => $p, 'qty' => (int)$qty];
            $total += ((float)$p->precio) * (int)$qty;
        }
    }

    // Fulfillment options from empresa
    $enablePickup = $empresa?->isPickupEnabled() ?? true;
    $enableDelivery = $empresa?->isDeliveryEnabled() ?? true;
    $defaultFulfillment = $empresa?->getDefaultFulfillmentType() ?? 'pickup';
    $showFulfillmentSelector = $enablePickup && $enableDelivery;
@endphp

@section('content')
<div class="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
    <div class="max-w-5xl mx-auto">
        <h1 class="font-heading text-3xl lg:text-4xl font-bold text-slate-800 mb-8">Finalizar Compra</h1>

        <div class="grid lg:grid-cols-3 gap-8">
            <!-- Form -->
            <div class="lg:col-span-2">
                <form method="POST" action="{{ route('checkout.place') }}" class="space-y-6">
                    @csrf

                    <!-- Contact Information -->
                    <div class="bg-white rounded-2xl shadow-premium p-6 lg:p-8">
                        <h2 class="font-heading text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style="background-color: var(--brand-primary);">1</span>
                            Datos de Contacto
                        </h2>

                        <div class="space-y-5">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Nombre completo *</label>
                                <input type="text"
                                       name="comprador_nombre"
                                       value="{{ old('comprador_nombre', auth()->user()?->name) }}"
                                       required
                                       class="w-full px-4 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all bg-slate-50 focus:bg-white">
                                @error('comprador_nombre')
                                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                                @enderror
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">WhatsApp *</label>
                                <input type="tel"
                                       name="comprador_whatsapp"
                                       value="{{ old('comprador_whatsapp', auth()->user()?->whatsapp) }}"
                                       required
                                       placeholder="81 1234 5678"
                                       class="w-full px-4 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all bg-slate-50 focus:bg-white">
                                @error('comprador_whatsapp')
                                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                                @enderror
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Email (opcional)</label>
                                <input type="email"
                                       name="comprador_email"
                                       value="{{ old('comprador_email', auth()->user()?->email) }}"
                                       class="w-full px-4 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all bg-slate-50 focus:bg-white">
                            </div>
                        </div>
                    </div>

                    <!-- Delivery Options -->
                    <div class="bg-white rounded-2xl shadow-premium p-6 lg:p-8" x-data="{ tipoEntrega: '{{ $defaultFulfillment }}' }">
                        <h2 class="font-heading text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style="background-color: var(--brand-primary);">2</span>
                            Entrega
                        </h2>

                        @if($showFulfillmentSelector)
                        {{-- Both options enabled: show selector --}}
                        <div class="space-y-4">
                            <label class="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50"
                                   :class="tipoEntrega === 'pickup' ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,white)]' : 'border-slate-200'">
                                <input type="radio"
                                       name="tipo_entrega"
                                       value="pickup"
                                       {{ $defaultFulfillment === 'pickup' ? 'checked' : '' }}
                                       x-model="tipoEntrega"
                                       class="mt-1 w-5 h-5"
                                       style="color: var(--brand-primary);">
                                <div class="flex-1">
                                    <div class="font-semibold text-slate-800">Recoger en tienda</div>
                                    <div class="text-sm text-slate-500 mt-1">Pasa por tu pedido cuando este listo</div>
                                </div>
                            </label>

                            <!-- Pickup ETA -->
                            <div x-show="tipoEntrega === 'pickup'" x-cloak
                                 class="ml-9 p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                                <div class="flex items-center gap-2 text-blue-800">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span class="font-semibold">Listo para recoger aprox:</span>
                                </div>
                                <p class="text-xl font-bold text-blue-900 mt-2">{{ $pickupEtaFormatted ?? 'Calculando...' }}</p>
                                <p class="text-sm text-blue-600 mt-2">Te notificaremos por WhatsApp cuando tu pedido este listo</p>
                            </div>

                            <label class="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50"
                                   :class="tipoEntrega === 'delivery' ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,white)]' : 'border-slate-200'">
                                <input type="radio"
                                       name="tipo_entrega"
                                       value="delivery"
                                       {{ $defaultFulfillment === 'delivery' ? 'checked' : '' }}
                                       x-model="tipoEntrega"
                                       class="mt-1 w-5 h-5"
                                       style="color: var(--brand-primary);">
                                <div class="flex-1">
                                    <div class="font-semibold text-slate-800">Envio a domicilio</div>
                                    <div class="text-sm text-slate-500 mt-1">Te contactaremos para coordinar el envio</div>
                                </div>
                            </label>
                        </div>

                        @elseif($enablePickup)
                        {{-- Only pickup enabled --}}
                        <input type="hidden" name="tipo_entrega" value="pickup">
                        <div class="p-4 rounded-xl border-2 border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,white)]">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white" style="background-color: var(--brand-primary);">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                </div>
                                <div>
                                    <div class="font-semibold text-slate-800">Recoger en tienda</div>
                                    <div class="text-sm text-slate-500">Pasa por tu pedido cuando este listo</div>
                                </div>
                            </div>
                            <div class="mt-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                                <div class="flex items-center gap-2 text-blue-800">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span class="font-semibold">Listo para recoger aprox:</span>
                                </div>
                                <p class="text-xl font-bold text-blue-900 mt-2">{{ $pickupEtaFormatted ?? 'Calculando...' }}</p>
                                <p class="text-sm text-blue-600 mt-2">Te notificaremos por WhatsApp cuando tu pedido este listo</p>
                            </div>
                        </div>

                        @elseif($enableDelivery)
                        {{-- Only delivery enabled --}}
                        <input type="hidden" name="tipo_entrega" value="delivery">
                        <div class="p-4 rounded-xl border-2 border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,white)]">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white" style="background-color: var(--brand-primary);">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                                    </svg>
                                </div>
                                <div>
                                    <div class="font-semibold text-slate-800">Envio a domicilio</div>
                                    <div class="text-sm text-slate-500">Te contactaremos para coordinar el envio</div>
                                </div>
                            </div>
                        </div>
                        @endif
                    </div>

                    <!-- Payment Method -->
                    <div class="bg-white rounded-2xl shadow-premium p-6 lg:p-8">
                        <h2 class="font-heading text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style="background-color: var(--brand-primary);">3</span>
                            Metodo de Pago
                        </h2>

                        <div class="space-y-4" x-data="{ metodoPago: 'efectivo' }">
                            <label class="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50"
                                   :class="metodoPago === 'efectivo' ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,white)]' : 'border-slate-200'">
                                <input type="radio"
                                       name="metodo_pago"
                                       value="efectivo"
                                       checked
                                       x-model="metodoPago"
                                       class="mt-1 w-5 h-5"
                                       style="color: var(--brand-primary);">
                                <div class="flex-1">
                                    <div class="font-semibold text-slate-800">Pago en efectivo</div>
                                    <div class="text-sm text-slate-500 mt-1">Paga al recoger o recibir tu pedido</div>
                                </div>
                            </label>

                            @if($hasMercadoPago ?? false)
                            <label class="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50"
                                   :class="metodoPago === 'mercadopago' ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,white)]' : 'border-slate-200'">
                                <input type="radio"
                                       name="metodo_pago"
                                       value="mercadopago"
                                       x-model="metodoPago"
                                       class="mt-1 w-5 h-5"
                                       style="color: var(--brand-primary);">
                                <div class="flex-1">
                                    <div class="font-semibold text-slate-800 flex items-center gap-2">
                                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="#009EE3">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                        </svg>
                                        MercadoPago
                                    </div>
                                    <div class="text-sm text-slate-500 mt-1">Paga con tarjeta, transferencia o saldo</div>
                                </div>
                            </label>
                            @endif
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit"
                            class="w-full py-4 rounded-xl font-semibold text-white text-lg transition-all hover-lift flex items-center justify-center gap-3"
                            style="background-color: var(--brand-primary);">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        Confirmar Pedido
                    </button>
                </form>
            </div>

            <!-- Order Summary -->
            <div>
                <div class="bg-white rounded-2xl shadow-premium p-6 lg:p-8 sticky top-24">
                    <h2 class="font-heading text-xl font-bold text-slate-800 mb-6">Resumen del Pedido</h2>

                    <div class="space-y-4 mb-6">
                        @foreach($items as $item)
                            @php
                                $itemImage = $item['producto']->display_image ?? '/images/producto-default.svg';
                            @endphp
                            <div class="flex gap-3">
                                <div class="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src="{{ $itemImage }}"
                                         alt="{{ $item['producto']->nombre }}"
                                         class="w-full h-full object-cover"
                                         loading="lazy"
                                         onerror="this.onerror=null; this.src='/images/producto-default.svg';">
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-slate-800 truncate">{{ $item['producto']->nombre }}</p>
                                    <p class="text-sm text-slate-500">x{{ $item['qty'] }}</p>
                                </div>
                                <p class="font-semibold text-slate-800">${{ number_format($item['producto']->precio * $item['qty'], 2) }}</p>
                            </div>
                        @endforeach
                    </div>

                    <div class="border-t border-slate-200 pt-4 space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Subtotal</span>
                            <span class="font-medium text-slate-800">${{ number_format($total, 2) }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Envio</span>
                            <span class="text-slate-500">Por definir</span>
                        </div>
                        <div class="flex justify-between items-center pt-4 border-t border-slate-200">
                            <span class="font-heading text-lg font-bold text-slate-800">Total</span>
                            <span class="font-heading text-2xl font-bold" style="color: var(--brand-primary);">
                                ${{ number_format($total, 2) }}
                            </span>
                        </div>
                    </div>

                    <a href="{{ route('cart.index') }}"
                       class="block text-center text-sm mt-6 hover:underline"
                       style="color: var(--brand-primary);">
                        Modificar carrito
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
