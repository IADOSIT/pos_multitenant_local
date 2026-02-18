@extends('layouts.admin', ['title' => 'Editar Promocion', 'header' => 'Editar Promocion'])

@section('content')
<div class="max-w-3xl mx-auto">
    <div class="mb-4">
        <a href="{{ route('admin.promotions.index') }}" class="text-primary-600 hover:text-primary-700">
            &larr; Volver a promociones
        </a>
    </div>

    <form action="{{ route('admin.promotions.update', $promotion) }}" method="POST" class="space-y-6">
        @csrf
        @method('PUT')

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-800">Informacion Basica</h2>

            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tienda *</label>
                    <select name="empresa_id" required
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                        @foreach($empresas as $empresa)
                        <option value="{{ $empresa->id }}" {{ $promotion->empresa_id == $empresa->id ? 'selected' : '' }}>
                            {{ $empresa->nombre }}
                        </option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Producto (opcional)</label>
                    <select name="producto_id"
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                        <option value="">Sin producto especifico</option>
                        @foreach($productos as $producto)
                        <option value="{{ $producto->id }}" {{ $promotion->producto_id == $producto->id ? 'selected' : '' }}>
                            {{ $producto->nombre }} - ${{ number_format($producto->precio, 2) }}
                        </option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                <input type="text" name="title" required value="{{ old('title', $promotion->title) }}"
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea name="description" rows="2"
                          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">{{ old('description', $promotion->description) }}</textarea>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-800">Precios</h2>

            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Precio Promocion</label>
                    <input type="number" name="promo_price" step="0.01" min="0"
                           value="{{ old('promo_price', $promotion->promo_price) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Precio Original</label>
                    <input type="number" name="original_price" step="0.01" min="0"
                           value="{{ old('original_price', $promotion->original_price) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-800">Apariencia</h2>

            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">URL Imagen Hero</label>
                    <input type="url" name="hero_image" value="{{ old('hero_image', $promotion->hero_image) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Badge (etiqueta)</label>
                    <input type="text" name="badge_text" value="{{ old('badge_text', $promotion->badge_text) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Texto del Boton</label>
                    <input type="text" name="cta_text" value="{{ old('cta_text', $promotion->cta_text) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">URL Personalizada</label>
                    <input type="url" name="cta_url" value="{{ old('cta_url', $promotion->cta_url) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-800">Vigencia</h2>

            <div class="grid md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <input type="datetime-local" name="starts_at"
                           value="{{ old('starts_at', $promotion->starts_at?->format('Y-m-d\TH:i')) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <input type="datetime-local" name="ends_at"
                           value="{{ old('ends_at', $promotion->ends_at?->format('Y-m-d\TH:i')) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                    <input type="number" name="sort_order" value="{{ old('sort_order', $promotion->sort_order) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" value="1"
                       {{ $promotion->is_active ? 'checked' : '' }}
                       class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm text-gray-700">Promocion activa</span>
            </label>
        </div>

        <div class="flex justify-end gap-4">
            <a href="{{ route('admin.promotions.index') }}"
               class="px-6 py-3 border rounded-lg hover:bg-gray-50">
                Cancelar
            </a>
            <button type="submit" class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                Guardar Cambios
            </button>
        </div>
    </form>
</div>
@endsection
