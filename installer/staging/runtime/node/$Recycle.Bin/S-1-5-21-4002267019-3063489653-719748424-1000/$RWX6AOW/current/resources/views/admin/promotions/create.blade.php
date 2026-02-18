@extends('layouts.admin', ['title' => 'Nueva Promocion', 'header' => 'Crear Promocion'])

@section('content')
<div class="max-w-3xl mx-auto">
    <div class="mb-4">
        <a href="{{ route('admin.promotions.index') }}" class="text-primary-600 hover:text-primary-700">
            &larr; Volver a promociones
        </a>
    </div>

    <form action="{{ route('admin.promotions.store') }}" method="POST" class="space-y-6">
        @csrf

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-800">Informacion Basica</h2>

            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tienda *</label>
                    <select name="empresa_id" required id="empresa_select"
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                        @foreach($empresas as $empresa)
                        <option value="{{ $empresa->id }}" {{ $empresaId == $empresa->id ? 'selected' : '' }}>
                            {{ $empresa->nombre }}
                        </option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Producto (opcional)</label>
                    <select name="producto_id" id="producto_select"
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                        <option value="">Sin producto especifico</option>
                        @foreach($productos as $producto)
                        <option value="{{ $producto->id }}" data-precio="{{ $producto->precio }}">
                            {{ $producto->nombre }} - ${{ number_format($producto->precio, 2) }}
                        </option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                <input type="text" name="title" required value="{{ old('title') }}"
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                       placeholder="Oferta especial de temporada">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea name="description" rows="2"
                          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Descripcion breve de la promocion">{{ old('description') }}</textarea>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-800">Precios</h2>

            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Precio Promocion</label>
                    <input type="number" name="promo_price" step="0.01" min="0" value="{{ old('promo_price') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                           placeholder="0.00">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Precio Original</label>
                    <input type="number" name="original_price" step="0.01" min="0" value="{{ old('original_price') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                           placeholder="0.00">
                    <p class="text-xs text-gray-500 mt-1">Se llenara automaticamente si seleccionas un producto</p>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-800">Apariencia</h2>

            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">URL Imagen Hero</label>
                    <input type="url" name="hero_image" value="{{ old('hero_image') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                           placeholder="https://...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Badge (etiqueta)</label>
                    <input type="text" name="badge_text" value="{{ old('badge_text') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                           placeholder="Oferta, Promo, Imperdible...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Texto del Boton</label>
                    <input type="text" name="cta_text" value="{{ old('cta_text', 'Ver oferta') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">URL Personalizada (opcional)</label>
                    <input type="url" name="cta_url" value="{{ old('cta_url') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                           placeholder="https://... (deja vacio para auto)">
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-800">Vigencia</h2>

            <div class="grid md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <input type="datetime-local" name="starts_at" value="{{ old('starts_at') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <input type="datetime-local" name="ends_at" value="{{ old('ends_at') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                    <input type="number" name="sort_order" value="{{ old('sort_order', 0) }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" value="1" checked
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
                Crear Promocion
            </button>
        </div>
    </form>
</div>

<script>
document.getElementById('producto_select')?.addEventListener('change', function() {
    const option = this.options[this.selectedIndex];
    const precio = option.dataset.precio;
    if (precio) {
        document.querySelector('input[name="original_price"]').value = precio;
    }
});
</script>
@endsection
