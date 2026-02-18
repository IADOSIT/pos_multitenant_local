@extends('layouts.storefront', ['title' => 'Seguimiento de Pedido'])

@section('content')
<div class="w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <div class="max-w-3xl mx-auto">
        <h1 class="font-heading text-3xl lg:text-4xl font-bold text-slate-800 mb-8 text-center">Seguimiento de Pedido</h1>

        <div class="bg-white rounded-2xl shadow-premium p-6 lg:p-8 space-y-6">
            <!-- Order Number -->
            <div class="flex justify-between items-center py-4 border-b border-slate-200">
                <span class="text-slate-500">Folio</span>
                <span class="font-heading text-2xl font-bold text-slate-800">{{ $orden->folio }}</span>
            </div>

            <!-- Status -->
            <div class="flex justify-between items-center py-4 border-b border-slate-200">
                <span class="text-slate-500">Estado</span>
                @php
                    $statusColors = [
                        'creada' => 'bg-blue-100 text-blue-800 border-blue-200',
                        'preparando' => 'bg-amber-100 text-amber-800 border-amber-200',
                        'lista' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        'entregada' => 'bg-slate-100 text-slate-800 border-slate-200',
                        'cancelada' => 'bg-red-100 text-red-800 border-red-200',
                    ];
                    $statusLabels = [
                        'creada' => 'Pedido recibido',
                        'preparando' => 'En preparacion',
                        'lista' => 'Listo para recoger',
                        'entregada' => 'Entregado',
                        'cancelada' => 'Cancelado',
                    ];
                    $statusColor = $statusColors[$orden->status] ?? 'bg-slate-100 text-slate-800 border-slate-200';
                    $statusLabel = $statusLabels[$orden->status] ?? ucfirst($orden->status);
                @endphp
                <span class="px-4 py-2 rounded-full text-sm font-semibold border {{ $statusColor }}">
                    {{ $statusLabel }}
                </span>
            </div>

            <!-- Delivery Type -->
            <div class="flex justify-between items-center py-4 border-b border-slate-200">
                <span class="text-slate-500">Tipo de entrega</span>
                <span class="font-semibold text-slate-800">
                    {{ $orden->tipo_entrega === 'delivery' ? 'A domicilio' : 'Recoger en tienda' }}
                </span>
            </div>

            <!-- ETA for Pickup -->
            @if($orden->tipo_entrega === 'pickup' && $orden->estimated_ready_at)
                <div class="flex justify-between items-center py-4 border-b border-slate-200">
                    <span class="text-slate-500">Listo para recoger</span>
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
                    <span class="font-semibold text-blue-600">{{ $etaText }}</span>
                </div>

                @if($orden->status === 'lista')
                    <div class="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5">
                        <div class="flex items-center gap-3 text-emerald-800">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            <span class="font-semibold text-lg">Tu pedido esta listo para recoger</span>
                        </div>
                    </div>
                @elseif($orden->status !== 'entregada' && $orden->status !== 'cancelada')
                    <div class="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                        <div class="flex items-center gap-3 text-blue-800 mb-2">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span class="font-semibold text-lg">Tiempo estimado: {{ $etaText }}</span>
                        </div>
                        <p class="text-sm text-blue-600 ml-9">Te notificaremos por WhatsApp cuando este listo</p>
                    </div>
                @endif
            @endif

            <!-- Total -->
            <div class="flex justify-between items-center py-4 border-b border-slate-200">
                <span class="text-slate-500">Total</span>
                <span class="font-heading text-2xl font-bold" style="color: var(--brand-primary);">
                    ${{ number_format($orden->total, 2) }}
                </span>
            </div>

            <!-- Privacy Notice -->
            <div class="text-sm text-slate-400 pt-4">
                Por privacidad, no mostramos datos personales en esta pantalla publica.
            </div>
        </div>

        <!-- Back to Store -->
        <div class="mt-8 text-center">
            <a href="{{ route('store.home') }}"
               class="inline-flex items-center gap-2 font-semibold transition-colors hover:underline"
               style="color: var(--brand-primary);">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Volver a la tienda
            </a>
        </div>
    </div>
</div>
@endsection
