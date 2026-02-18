@extends('layouts.admin', ['title' => 'Pagos', 'header' => 'Pagos'])

@section('content')
<div class="space-y-6">
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">Pagos</h1>
            <p class="text-gray-500">Historial de pagos y transacciones</p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Total</div>
            <div class="text-2xl font-bold text-gray-800">{{ $stats['total'] }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Pagados</div>
            <div class="text-2xl font-bold text-green-600">{{ $stats['paid'] }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Pendientes</div>
            <div class="text-2xl font-bold text-yellow-600">{{ $stats['pending'] }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Fallidos</div>
            <div class="text-2xl font-bold text-red-600">{{ $stats['failed'] }}</div>
        </div>
    </div>

    <!-- Filters -->
    <form method="GET" class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-4 items-end">
            <div>
                <label class="block text-sm text-gray-600 mb-1">Estado</label>
                <select name="status" class="px-3 py-2 border rounded-lg text-sm">
                    <option value="">Todos</option>
                    <option value="paid" {{ request('status') === 'paid' ? 'selected' : '' }}>Pagado</option>
                    <option value="pending" {{ request('status') === 'pending' ? 'selected' : '' }}>Pendiente</option>
                    <option value="failed" {{ request('status') === 'failed' ? 'selected' : '' }}>Fallido</option>
                </select>
            </div>
            <div>
                <label class="block text-sm text-gray-600 mb-1">Desde</label>
                <input type="date" name="from" value="{{ request('from') }}"
                       class="px-3 py-2 border rounded-lg text-sm">
            </div>
            <div>
                <label class="block text-sm text-gray-600 mb-1">Hasta</label>
                <input type="date" name="to" value="{{ request('to') }}"
                       class="px-3 py-2 border rounded-lg text-sm">
            </div>
            <button type="submit" class="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900">
                Filtrar
            </button>
            <a href="{{ route('admin.pagos.index') }}" class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                Limpiar
            </a>
        </div>
    </form>

    <!-- Payments Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metodo</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($pagos as $pago)
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {{ $pago->created_at->format('d/m/Y H:i') }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        @if($pago->orden)
                            <a href="{{ route('ops.ordenes.show', $pago->orden_id) }}" class="text-primary-600 hover:underline">
                                {{ $pago->orden->folio }}
                            </a>
                        @else
                            <span class="text-gray-400">-</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        {{ ucfirst($pago->metodo ?? '-') }}
                        @if($pago->provider)
                            <span class="text-xs text-gray-400">({{ $pago->provider }})</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                        ${{ number_format($pago->monto, 2) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        @php
                            $statusColors = [
                                'paid' => 'bg-green-100 text-green-800',
                                'pending' => 'bg-yellow-100 text-yellow-800',
                                'failed' => 'bg-red-100 text-red-800',
                            ];
                        @endphp
                        <span class="px-2 py-1 text-xs font-semibold rounded-full {{ $statusColors[$pago->status] ?? 'bg-gray-100 text-gray-800' }}">
                            {{ $pago->getStatusLabel() }}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="{{ route('admin.pagos.show', $pago->id) }}" class="text-primary-600 hover:text-primary-900 mr-3">Ver</a>
                        @if($pago->provider === 'mercadopago' && $pago->provider_id)
                            <form method="POST" action="{{ route('admin.pagos.refresh', $pago->id) }}" class="inline">
                                @csrf
                                <button type="submit" class="text-blue-600 hover:text-blue-900">Refrescar</button>
                            </form>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        No hay pagos registrados
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>

        @if($pagos->hasPages())
            <div class="px-6 py-4 border-t">
                {{ $pagos->links() }}
            </div>
        @endif
    </div>
</div>
@endsection
