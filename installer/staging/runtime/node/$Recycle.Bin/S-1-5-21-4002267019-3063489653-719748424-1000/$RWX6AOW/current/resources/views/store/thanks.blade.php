@extends('layouts.storefront', ['title' => 'Gracias por tu pedido'])

@section('content')
<div class="w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <div class="max-w-2xl mx-auto">
        @php
            $statusConfig = [
                'success' => ['icon' => 'check', 'bg' => 'bg-emerald-100', 'text' => 'text-emerald-600', 'border' => 'border-emerald-200'],
                'failure' => ['icon' => 'x', 'bg' => 'bg-red-100', 'text' => 'text-red-600', 'border' => 'border-red-200'],
                'pending' => ['icon' => 'clock', 'bg' => 'bg-amber-100', 'text' => 'text-amber-600', 'border' => 'border-amber-200'],
            ];
            $config = $statusConfig[$status ?? 'success'] ?? $statusConfig['success'];
        @endphp

        <div class="bg-white rounded-2xl shadow-premium p-8 lg:p-12 text-center">
            <!-- Status Icon -->
            <div class="w-24 h-24 {{ $config['bg'] }} rounded-full flex items-center justify-center mx-auto mb-8">
                @if(($status ?? 'success') === 'success')
                    <svg class="w-12 h-12 {{ $config['text'] }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                @elseif($status === 'failure')
                    <svg class="w-12 h-12 {{ $config['text'] }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                @else
                    <svg class="w-12 h-12 {{ $config['text'] }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                @endif
            </div>

            <!-- Title -->
            <h1 class="font-heading text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
                @if(($status ?? 'success') === 'success')
                    Gracias por tu pedido
                @elseif($status === 'failure')
                    Hubo un problema con tu pago
                @else
                    Pago pendiente
                @endif
            </h1>

            <p class="text-lg text-slate-600 mb-8">{{ $message ?? 'Tu pedido ha sido recibido correctamente.' }}</p>

            @if(isset($orden))
                <!-- Order Number -->
                <div class="{{ $config['bg'] }} {{ $config['border'] }} border-2 rounded-2xl p-6 mb-8">
                    <div class="text-sm text-slate-600 mb-2">Numero de pedido</div>
                    <div class="font-heading text-3xl font-bold {{ $config['text'] }}">{{ $orden->folio }}</div>
                </div>

                <!-- Order Details -->
                <div class="text-left space-y-4 mb-8">
                    <div class="flex justify-between items-center py-3 border-b border-slate-200">
                        <span class="text-slate-500">Cliente</span>
                        <span class="font-semibold text-slate-800">{{ $orden->comprador_nombre }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 border-b border-slate-200">
                        <span class="text-slate-500">WhatsApp</span>
                        <span class="font-semibold text-slate-800">{{ $orden->comprador_whatsapp }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 border-b border-slate-200">
                        <span class="text-slate-500">Entrega</span>
                        <span class="font-semibold text-slate-800">{{ $orden->tipo_entrega === 'delivery' ? 'A domicilio' : 'Recoger en tienda' }}</span>
                    </div>
                    @if($orden->tipo_entrega === 'pickup' && $orden->estimated_ready_at)
                        <div class="flex justify-between items-center py-3 border-b border-slate-200">
                            <span class="text-slate-500">Listo para recoger</span>
                            <span class="font-semibold text-blue-600">
                                @php
                                    $eta = $orden->estimated_ready_at;
                                    $now = now();
                                    if ($eta->isToday()) {
                                        $etaText = 'Hoy a las ' . $eta->format('g:i A');
                                    } elseif ($eta->isTomorrow()) {
                                        $etaText = 'Manana a las ' . $eta->format('g:i A');
                                    } else {
                                        $etaText = $eta->format('d/m/Y') . ' a las ' . $eta->format('g:i A');
                                    }
                                @endphp
                                {{ $etaText }}
                            </span>
                        </div>
                    @endif
                    <div class="flex justify-between items-center py-3">
                        <span class="text-slate-500">Total</span>
                        <span class="font-heading text-2xl font-bold" style="color: var(--brand-primary);">
                            ${{ number_format($orden->total, 2) }}
                        </span>
                    </div>
                </div>

                <!-- ETA Notice -->
                @if($orden->tipo_entrega === 'pickup' && $orden->estimated_ready_at)
                    <div class="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 text-left">
                        <div class="flex items-center gap-3 text-blue-800 mb-3">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span class="font-semibold text-lg">Tiempo estimado de recoleccion</span>
                        </div>
                        <p class="text-xl font-bold text-blue-900 mb-2">{{ $etaText }}</p>
                        <p class="text-sm text-blue-600">Te notificaremos por WhatsApp cuando tu pedido este listo para recoger</p>
                    </div>
                @else
                    <div class="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
                        <p class="text-slate-600">
                            Te enviaremos un mensaje por WhatsApp cuando tu pedido este listo.
                            Puedes dar seguimiento a tu pedido con el numero <strong>{{ $orden->folio }}</strong>
                        </p>
                    </div>
                @endif
            @endif

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                @if(isset($orden))
                    <a href="{{ route('store.track', $orden->folio) }}"
                       class="px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover-lift"
                       style="background-color: var(--brand-primary);">
                        Ver estado del pedido
                    </a>
                @endif
                <a href="{{ route('store.home') }}"
                   class="px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold text-lg">
                    Seguir comprando
                </a>
            </div>
        </div>
    </div>
</div>
@endsection
