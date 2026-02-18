@extends('layouts.admin', ['title' => 'Detalle de Pago', 'header' => 'Detalle de Pago'])

@section('content')
<div class="max-w-4xl space-y-6">
    <div class="flex items-center justify-between">
        <a href="{{ route('admin.pagos.index') }}" class="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver a Pagos
        </a>

        @if($pago->provider === 'mercadopago' && $pago->provider_id)
            <form method="POST" action="{{ route('admin.pagos.refresh', $pago->id) }}">
                @csrf
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Refrescar desde MercadoPago
                </button>
            </form>
        @endif
    </div>

    <!-- Payment Info -->
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800">Informacion del Pago</h2>
            @php
                $statusColors = [
                    'paid' => 'bg-green-100 text-green-800',
                    'pending' => 'bg-yellow-100 text-yellow-800',
                    'failed' => 'bg-red-100 text-red-800',
                ];
            @endphp
            <span class="px-3 py-1 text-sm font-semibold rounded-full {{ $statusColors[$pago->status] ?? 'bg-gray-100 text-gray-800' }}">
                {{ $pago->getStatusLabel() }}
            </span>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
            <div>
                <div class="text-sm text-gray-500">ID</div>
                <div class="font-medium">#{{ $pago->id }}</div>
            </div>
            <div>
                <div class="text-sm text-gray-500">Monto</div>
                <div class="text-2xl font-bold text-gray-800">${{ number_format($pago->monto, 2) }}</div>
            </div>
            <div>
                <div class="text-sm text-gray-500">Metodo</div>
                <div class="font-medium">{{ ucfirst($pago->metodo ?? '-') }}</div>
            </div>
            <div>
                <div class="text-sm text-gray-500">Proveedor</div>
                <div class="font-medium">{{ ucfirst($pago->provider ?? '-') }}</div>
            </div>
            <div>
                <div class="text-sm text-gray-500">Fecha</div>
                <div class="font-medium">{{ $pago->created_at->format('d/m/Y H:i:s') }}</div>
            </div>
            @if($pago->provider_id)
            <div>
                <div class="text-sm text-gray-500">ID Externo</div>
                <div class="font-mono text-sm">{{ $pago->provider_id }}</div>
            </div>
            @endif
        </div>
    </div>

    <!-- Order Info -->
    @if($pago->orden)
    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Orden Asociada</h2>

        <div class="grid md:grid-cols-2 gap-4 mb-4">
            <div>
                <div class="text-sm text-gray-500">Folio</div>
                <div class="font-medium">
                    <a href="{{ route('ops.ordenes.show', $pago->orden_id) }}" class="text-primary-600 hover:underline">
                        {{ $pago->orden->folio }}
                    </a>
                </div>
            </div>
            <div>
                <div class="text-sm text-gray-500">Cliente</div>
                <div class="font-medium">{{ $pago->orden->comprador_nombre }}</div>
            </div>
            <div>
                <div class="text-sm text-gray-500">WhatsApp</div>
                <div class="font-medium">{{ $pago->orden->comprador_whatsapp }}</div>
            </div>
            <div>
                <div class="text-sm text-gray-500">Total Orden</div>
                <div class="font-medium">${{ number_format($pago->orden->total, 2) }}</div>
            </div>
        </div>

        @if($pago->orden->items->count())
        <div class="border-t pt-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Productos</h3>
            <div class="space-y-2">
                @foreach($pago->orden->items as $item)
                <div class="flex justify-between text-sm">
                    <span>{{ $item->nombre_snapshot ?? $item->nombre }} x {{ $item->cantidad }}</span>
                    <span class="font-medium">${{ number_format($item->total, 2) }}</span>
                </div>
                @endforeach
            </div>
        </div>
        @endif
    </div>
    @endif

    <!-- Provider Response -->
    @if($pago->provider_response)
    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Respuesta del Proveedor</h2>
        <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">{{ json_encode($pago->provider_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) }}</pre>
    </div>
    @endif
</div>
@endsection
