@extends('layouts.admin', ['title'=>'Turno #'.$turno->id,'header'=>'Turno de Caja'])

@section('content')
<div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <div class="flex items-center gap-3">
                <a href="{{ route('admin.caja.index') }}" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                </a>
                <h1 class="text-2xl font-bold text-gray-800">Turno #{{ $turno->id }}</h1>
                @if($turno->cerrado_at)
                    <span class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">Cerrado</span>
                @else
                    <span class="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-1">
                        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Abierto
                    </span>
                @endif
            </div>
            <p class="text-gray-500 mt-1">
                Abierto: {{ ($turno->abierto_at ?? $turno->created_at)->format('d/m/Y H:i') }}
                @if($turno->cerrado_at)
                    | Cerrado: {{ $turno->cerrado_at->format('d/m/Y H:i') }}
                @endif
            </p>
        </div>

        @if(!$turno->cerrado_at)
            <form method="POST" action="{{ route('admin.caja.cerrar', $turno->id) }}">
                @csrf
                <button type="submit"
                        onclick="return confirm('¿Seguro que deseas cerrar el turno?')"
                        class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition">
                    Cerrar Turno
                </button>
            </form>
        @endif
    </div>

    <!-- Resumen -->
    <div class="grid md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-5">
            <div class="text-sm text-gray-500 mb-1">Saldo Inicial</div>
            <div class="text-2xl font-bold text-gray-800">${{ number_format($turno->saldo_inicial ?? 0, 2) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-5">
            <div class="text-sm text-gray-500 mb-1">Efectivo</div>
            <div class="text-2xl font-bold text-green-600">${{ number_format($breakdown['efectivo'] ?? 0, 2) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-5">
            <div class="text-sm text-gray-500 mb-1">Tarjeta</div>
            <div class="text-2xl font-bold text-blue-600">${{ number_format($breakdown['tarjeta'] ?? 0, 2) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-5">
            <div class="text-sm text-gray-500 mb-1">Transferencia</div>
            <div class="text-2xl font-bold text-purple-600">${{ number_format($breakdown['transferencia'] ?? 0, 2) }}</div>
        </div>
    </div>

    <!-- Total -->
    <div class="bg-primary-50 border border-primary-200 rounded-lg p-5 mb-6">
        <div class="flex justify-between items-center">
            <div>
                <div class="text-sm text-primary-600 font-medium">Total del Turno</div>
                <div class="text-3xl font-bold text-primary-700">${{ number_format($total ?? 0, 2) }}</div>
            </div>
            @if($turno->saldo_final_declarado)
                <div class="text-right">
                    <div class="text-sm text-gray-500">Saldo Final Declarado</div>
                    <div class="text-xl font-bold text-gray-700">${{ number_format($turno->saldo_final_declarado, 2) }}</div>
                </div>
            @endif
        </div>
    </div>

    <!-- Formulario Nuevo Movimiento -->
    @if(!$turno->cerrado_at)
    <div class="bg-white rounded-lg shadow p-5 mb-6">
        <div class="font-semibold mb-4">Registrar Movimiento</div>
        <form method="POST" action="{{ route('admin.caja.movimiento', $turno->id) }}" class="flex flex-wrap gap-3 items-end">
            @csrf
            <div>
                <label class="block text-sm text-gray-600 mb-1">Tipo</label>
                <select name="tipo" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="venta">Venta</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                    <option value="gasto">Gasto</option>
                </select>
            </div>
            <div>
                <label class="block text-sm text-gray-600 mb-1">Metodo</label>
                <select name="metodo" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                </select>
            </div>
            <div>
                <label class="block text-sm text-gray-600 mb-1">Monto</label>
                <input name="monto" type="number" step="0.01" min="0" required
                       class="border border-gray-300 rounded-lg px-3 py-2 w-32 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                       placeholder="0.00">
            </div>
            <div class="flex-1 min-w-[200px]">
                <label class="block text-sm text-gray-600 mb-1">Nota (opcional)</label>
                <input name="nota" type="text" maxlength="255"
                       class="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                       placeholder="Descripcion del movimiento">
            </div>
            <button type="submit" class="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium">
                Registrar
            </button>
        </form>
    </div>
    @endif

    <!-- Tabla de Movimientos -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-5 border-b">
            <div class="font-semibold">Movimientos del Turno</div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="text-left p-4 font-medium text-gray-600">Fecha</th>
                        <th class="text-left p-4 font-medium text-gray-600">Tipo</th>
                        <th class="text-left p-4 font-medium text-gray-600">Metodo</th>
                        <th class="text-right p-4 font-medium text-gray-600">Monto</th>
                        <th class="text-left p-4 font-medium text-gray-600">Nota</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    @forelse($movs as $m)
                        <tr class="hover:bg-gray-50">
                            <td class="p-4 text-gray-600">{{ $m->created_at->format('d/m/Y H:i') }}</td>
                            <td class="p-4">
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
                            <td class="p-4 text-gray-600">{{ ucfirst($m->metodo) }}</td>
                            <td class="p-4 text-right font-bold {{ $m->monto >= 0 ? 'text-green-600' : 'text-red-600' }}">
                                ${{ number_format($m->monto, 2) }}
                            </td>
                            <td class="p-4 text-gray-500">{{ $m->nota }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="p-8 text-center text-gray-500">
                                No hay movimientos en este turno
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
