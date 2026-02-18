@extends('layouts.admin', ['title' => 'Temas', 'header' => 'Temas / Plantillas'])

@section('content')
<div class="space-y-6">
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">Temas / Plantillas</h1>
            <p class="text-gray-500">Presets de colores y estilos para empresas</p>
        </div>
        <a href="{{ route('admin.temas.create') }}"
           class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Nuevo Tema
        </a>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        @forelse($themes as $theme)
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="h-20 flex" style="background: linear-gradient(135deg, {{ $theme->primary_color }} 0%, {{ $theme->secondary_color }} 100%);">
                <div class="m-auto">
                    <span class="px-3 py-1 rounded text-white text-sm font-medium" style="background: {{ $theme->accent_color }}">
                        Acento
                    </span>
                </div>
            </div>
            <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-gray-800">{{ $theme->nombre }}</h3>
                    @if($theme->is_default)
                        <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">Default</span>
                    @endif
                </div>
                <p class="text-sm text-gray-500 mb-3">{{ $theme->description ?? 'Sin descripcion' }}</p>

                <div class="flex items-center gap-2 mb-3">
                    <div class="w-6 h-6 rounded border" style="background: {{ $theme->primary_color }}" title="Primario"></div>
                    <div class="w-6 h-6 rounded border" style="background: {{ $theme->secondary_color }}" title="Secundario"></div>
                    <div class="w-6 h-6 rounded border" style="background: {{ $theme->accent_color }}" title="Acento"></div>
                    <span class="text-xs text-gray-500 ml-2">{{ $theme->mode }}</span>
                </div>

                <div class="flex items-center justify-between pt-3 border-t">
                    <span class="text-xs {{ $theme->activo ? 'text-green-600' : 'text-gray-400' }}">
                        {{ $theme->activo ? 'Activo' : 'Inactivo' }}
                    </span>
                    <div class="flex gap-2">
                        <a href="{{ route('admin.temas.edit', $theme->id) }}" class="text-primary-600 hover:text-primary-900 text-sm">Editar</a>
                        <form method="POST" action="{{ route('admin.temas.destroy', $theme->id) }}" class="inline"
                              onsubmit="return confirm('Eliminar este tema?')">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-red-600 hover:text-red-900 text-sm">Eliminar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        @empty
        <div class="col-span-full text-center py-12 text-gray-500">
            No hay temas creados
        </div>
        @endforelse
    </div>
</div>
@endsection
