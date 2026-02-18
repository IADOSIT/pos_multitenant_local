@extends('layouts.admin', ['title'=>'Caja','header'=>'Caja'])

@section('content')
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Caja</h1>
        <p class="text-gray-500">Control de turnos y movimientos</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
        <!-- Turno Actual -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="font-semibold text-lg mb-4">Turno Actual</div>

            @if($turno)
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        <span class="text-green-600 font-medium">Turno Abierto</span>
                    </div>

                    <div class="text-sm text-gray-600">
                        <div><strong>ID:</strong> #{{ $turno->id }}</div>
                        <div><strong>Abierto:</strong> {{ ($turno->abierto_at ?? $turno->created_at)->format('d/m/Y H:i') }}</div>
                        <div><strong>Saldo Inicial:</strong> ${{ number_format($turno->saldo_inicial ?? 0, 2) }}</div>
                    </div>

                    <div class="flex gap-2 pt-3">
                        <a href="{{ route('admin.caja.turno', $turno->id) }}"
                           class="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg text-center hover:bg-primary-700 transition">
                            Ver Turno
                        </a>
                        <form method="POST" action="{{ route('admin.caja.cerrar', $turno->id) }}" class="flex-1">
                            @csrf
                            <button type="submit"
                                    onclick="return confirm('¿Seguro que deseas cerrar el turno?')"
                                    class="w-full px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition">
                                Cerrar Turno
                            </button>
                        </form>
                    </div>
                </div>
            @else
                <div class="text-center py-6">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <p class="text-gray-500 mb-4">No hay turno abierto</p>

                    <form method="POST" action="{{ route('admin.caja.abrir') }}">
                        @csrf
                        <button type="submit"
                                class="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                            Abrir Turno
                        </button>
                    </form>
                </div>
            @endif
        </div>

        <!-- Ultimos Movimientos -->
        <div class="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <div class="flex justify-between items-center mb-4">
                <div class="font-semibold text-lg">Ultimos Movimientos</div>
                <a href="{{ route('admin.caja.history') }}" class="text-sm text-primary-600 hover:underline">
                    Ver historial completo
                </a>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-y">
                        <tr>
                            <th class="text-left p-3 font-medium text-gray-600">Fecha</th>
                            <th class="text-left p-3 font-medium text-gray-600">Tipo</th>
                            <th class="text-left p-3 font-medium text-gray-600">Metodo</th>
                            <th class="text-right p-3 font-medium text-gray-600">Monto</th>
                            <th class="text-left p-3 font-medium text-gray-600">Nota</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        @forelse($movs as $m)
                            <tr class="hover:bg-gray-50">
                                <td class="p-3 text-gray-600">{{ $m->created_at->format('d/m H:i') }}</td>
                                <td class="p-3">
                                    @php
                                        $tipoColors = [
                                            'venta' => 'bg-green-100 text-green-700',
                                            'ingreso' => 'bg-blue-100 text-blue-700',
                                            'entrada' => 'bg-blue-100 text-blue-700',
                                            'egreso' => 'bg-red-100 text-red-700',
                                            'gasto' => 'bg-red-100 text-red-700',
                                            'salida' => 'bg-orange-100 text-orange-700',
                                        ];
                                    @endphp
                                    <span class="px-2 py-1 rounded text-xs font-medium {{ $tipoColors[$m->tipo] ?? 'bg-gray-100 text-gray-700' }}">
                                        {{ ucfirst($m->tipo) }}
                                    </span>
                                </td>
                                <td class="p-3 text-gray-600">{{ ucfirst($m->metodo) }}</td>
                                <td class="p-3 text-right font-bold {{ $m->monto >= 0 ? 'text-green-600' : 'text-red-600' }}">
                                    ${{ number_format($m->monto, 2) }}
                                </td>
                                <td class="p-3 text-xs text-gray-500 max-w-xs truncate">{{ $m->nota }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="p-8 text-center text-gray-500">
                                    No hay movimientos registrados
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection
