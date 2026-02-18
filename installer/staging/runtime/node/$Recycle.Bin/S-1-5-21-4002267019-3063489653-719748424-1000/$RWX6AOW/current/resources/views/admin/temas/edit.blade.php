@extends('layouts.admin', ['title' => 'Editar Tema', 'header' => 'Editar Tema'])

@section('content')
<div class="max-w-2xl">
    <div class="mb-6">
        <a href="{{ route('admin.temas.index') }}" class="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver a Temas
        </a>
    </div>

    <form method="POST" action="{{ route('admin.temas.update', $theme->id) }}" class="space-y-6"
          x-data="{
              primary: '{{ $theme->primary_color }}',
              secondary: '{{ $theme->secondary_color }}',
              accent: '{{ $theme->accent_color }}'
          }">
        @csrf
        @method('PUT')

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 class="font-semibold text-gray-800 border-b pb-2">Informacion del Tema</h3>

            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input type="text" name="nombre" value="{{ old('nombre', $theme->nombre) }}" required
                           class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input type="text" name="slug" value="{{ old('slug', $theme->slug) }}"
                           class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea name="description" rows="2"
                          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">{{ old('description', $theme->description) }}</textarea>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Modo</label>
                <select name="mode" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="light" {{ $theme->mode === 'light' ? 'selected' : '' }}>Claro (Light)</option>
                    <option value="dark" {{ $theme->mode === 'dark' ? 'selected' : '' }}>Oscuro (Dark)</option>
                </select>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 class="font-semibold text-gray-800 border-b pb-2">Colores</h3>

            <div class="grid md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Color Primario</label>
                    <input type="color" name="primary_color" x-model="primary"
                           class="w-full h-12 border rounded-lg cursor-pointer">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Color Secundario</label>
                    <input type="color" name="secondary_color" x-model="secondary"
                           class="w-full h-12 border rounded-lg cursor-pointer">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Color Acento</label>
                    <input type="color" name="accent_color" x-model="accent"
                           class="w-full h-12 border rounded-lg cursor-pointer">
                </div>
            </div>

            <!-- Preview -->
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Vista previa</label>
                <div class="rounded-lg overflow-hidden border">
                    <div class="h-16" :style="'background: linear-gradient(135deg, ' + primary + ' 0%, ' + secondary + ' 100%)'"></div>
                    <div class="p-4 bg-gray-50">
                        <button type="button" class="px-4 py-2 rounded text-white text-sm" :style="'background: ' + primary">
                            Boton Primario
                        </button>
                        <button type="button" class="px-4 py-2 rounded text-white text-sm ml-2" :style="'background: ' + accent">
                            Boton Acento
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <div class="flex items-center gap-6">
                <label class="flex items-center">
                    <input type="checkbox" name="activo" value="1" {{ $theme->activo ? 'checked' : '' }}
                           class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                    <span class="ml-2 text-sm text-gray-700">Tema activo</span>
                </label>
                <label class="flex items-center">
                    <input type="checkbox" name="is_default" value="1" {{ $theme->is_default ? 'checked' : '' }}
                           class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                    <span class="ml-2 text-sm text-gray-700">Tema por defecto</span>
                </label>
            </div>
        </div>

        <div class="flex justify-end gap-3">
            <a href="{{ route('admin.temas.index') }}"
               class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
            </a>
            <button type="submit"
                    class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Guardar Cambios
            </button>
        </div>
    </form>
</div>
@endsection
