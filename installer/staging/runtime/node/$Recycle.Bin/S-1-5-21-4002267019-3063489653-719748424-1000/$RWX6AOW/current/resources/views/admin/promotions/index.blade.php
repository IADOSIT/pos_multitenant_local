@extends('layouts.admin', ['title' => 'Promociones', 'header' => 'Promociones del Portal'])

@section('content')
<div class="space-y-4">
    <div class="flex justify-between items-center">
        <p class="text-gray-600">Gestiona las promociones que aparecen en el Portal Central</p>
        <a href="{{ route('admin.promotions.create') }}"
           class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Nueva Promocion
        </a>
    </div>

    @if(session('success'))
    <div class="p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg">
        {{ session('success') }}
    </div>
    @endif

    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promocion</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vigencia</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($promotions as $promo)
                <tr>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            @if($promo->hero_image)
                            <img src="{{ $promo->hero_image }}" alt="" class="w-12 h-12 object-cover rounded">
                            @elseif($promo->producto?->imagen_url)
                            <img src="{{ $promo->producto->imagen_url }}" alt="" class="w-12 h-12 object-cover rounded">
                            @endif
                            <div>
                                <div class="font-medium text-gray-900">{{ $promo->title }}</div>
                                @if($promo->badge_text)
                                <span class="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">{{ $promo->badge_text }}</span>
                                @endif
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                        {{ $promo->empresa?->nombre ?? '-' }}
                    </td>
                    <td class="px-6 py-4">
                        @if($promo->promo_price)
                        <div class="text-green-600 font-bold">${{ number_format($promo->promo_price, 2) }}</div>
                        @if($promo->original_price)
                        <div class="text-xs text-gray-400 line-through">${{ number_format($promo->original_price, 2) }}</div>
                        @endif
                        @else
                        <span class="text-gray-400">-</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                        @if($promo->starts_at || $promo->ends_at)
                        {{ $promo->starts_at?->format('d/m/Y') ?? 'Inicio' }} -
                        {{ $promo->ends_at?->format('d/m/Y') ?? 'Sin fin' }}
                        @else
                        Permanente
                        @endif
                    </td>
                    <td class="px-6 py-4">
                        @if($promo->isCurrentlyActive())
                        <span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Activa</span>
                        @else
                        <span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Inactiva</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 text-right space-x-2">
                        <form action="{{ route('admin.promotions.toggle', $promo) }}" method="POST" class="inline">
                            @csrf
                            <button type="submit" class="text-sm text-gray-600 hover:text-gray-900">
                                {{ $promo->is_active ? 'Desactivar' : 'Activar' }}
                            </button>
                        </form>
                        <a href="{{ route('admin.promotions.edit', $promo) }}" class="text-sm text-primary-600 hover:text-primary-700">
                            Editar
                        </a>
                        <form action="{{ route('admin.promotions.destroy', $promo) }}" method="POST" class="inline"
                              onsubmit="return confirm('Eliminar esta promocion?')">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-sm text-red-600 hover:text-red-700">Eliminar</button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        No hay promociones configuradas.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{ $promotions->links() }}
</div>
@endsection
