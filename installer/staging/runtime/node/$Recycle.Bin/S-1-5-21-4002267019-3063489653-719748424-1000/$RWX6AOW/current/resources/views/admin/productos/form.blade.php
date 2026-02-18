@csrf
<div class="grid md:grid-cols-2 gap-4">
  <div>
    <label class="text-xs text-gray-500">Nombre</label>
    <input name="nombre" value="{{ old('nombre', $producto->nombre ?? '') }}" class="w-full mt-1 border rounded px-3 py-2">
    @error('nombre')<div class="text-xs text-red-600 mt-1">{{ $message }}</div>@enderror
  </div>
  <div>
    <label class="text-xs text-gray-500">Categoria</label>
    <select name="categoria_id" class="w-full mt-1 border rounded px-3 py-2">
      <option value="">-</option>
      @foreach($categorias as $c)
        <option value="{{ $c->id }}" @selected((string)old('categoria_id', $producto->categoria_id ?? '')===(string)$c->id)>{{ $c->nombre }}</option>
      @endforeach
    </select>
  </div>

  <div>
    <label class="text-xs text-gray-500">Precio</label>
    <input name="precio" type="number" step="0.01" value="{{ old('precio', $producto->precio ?? '0') }}" class="w-full mt-1 border rounded px-3 py-2">
  </div>

  <div>
    <label class="text-xs text-gray-500">SKU</label>
    <input name="sku" value="{{ old('sku', $producto->sku ?? '') }}" class="w-full mt-1 border rounded px-3 py-2">
  </div>

  <div class="md:col-span-2">
    <label class="text-xs text-gray-500">Descripcion</label>
    <textarea name="descripcion" rows="3" class="w-full mt-1 border rounded px-3 py-2">{{ old('descripcion', $producto->descripcion ?? '') }}</textarea>
  </div>

  <!-- Image Section -->
  <div class="md:col-span-2 border rounded-lg p-4 bg-gray-50">
    <label class="text-xs text-gray-500 font-medium block mb-3">Imagen del producto</label>

    <div class="grid md:grid-cols-3 gap-4">
      <!-- Preview -->
      <div class="flex flex-col items-center">
        <div class="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center" id="image-preview-container">
          @php
            $currentImage = isset($producto) && $producto->exists ? $producto->display_image : asset('/images/producto-default.svg');
          @endphp
          <img src="{{ $currentImage }}" alt="Preview" id="image-preview" class="w-full h-full object-cover">
        </div>
        <span class="text-xs text-gray-400 mt-1">Vista previa</span>
      </div>

      <!-- Upload & Options -->
      <div class="md:col-span-2 space-y-3">
        <!-- File Upload -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Subir imagen</label>
          <input type="file" name="imagen" accept="image/*" id="imagen-input"
                 class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer">
          <p class="text-xs text-gray-400 mt-1">JPG, PNG o WebP. Max 2MB</p>
          @error('imagen')<div class="text-xs text-red-600 mt-1">{{ $message }}</div>@enderror
        </div>

        <!-- Image Source -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Fuente de imagen</label>
          <select name="image_source" id="image-source" class="w-full border rounded px-3 py-2 text-sm">
            <option value="auto" @selected(old('image_source', $producto->image_source ?? 'auto') === 'auto')>Automatica (por nombre)</option>
            <option value="manual" @selected(old('image_source', $producto->image_source ?? '') === 'manual')>Manual (subir archivo)</option>
            <option value="default" @selected(old('image_source', $producto->image_source ?? '') === 'default')>Imagen por defecto</option>
          </select>
        </div>

        <!-- URL Manual (optional) -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">O ingresar URL de imagen</label>
          <input type="url" name="imagen_url" value="{{ old('imagen_url', $producto->imagen_url ?? '') }}"
                 placeholder="https://..." class="w-full border rounded px-3 py-2 text-sm" id="imagen-url">
        </div>
      </div>
    </div>
  </div>

  <div class="md:col-span-2">
    <label class="inline-flex items-center gap-2">
      <input type="hidden" name="activo" value="0">
      <input type="checkbox" name="activo" value="1" @checked((bool)old('activo', $producto->activo ?? true))>
      <span class="text-sm">Activo</span>
    </label>
  </div>
</div>

<div class="mt-5 flex gap-2">
  <button class="px-4 py-2 rounded bg-black text-white">Guardar</button>
  <a href="{{ route('admin.productos.index') }}" class="px-4 py-2 rounded border">Cancelar</a>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('imagen-input');
  const urlInput = document.getElementById('imagen-url');
  const sourceSelect = document.getElementById('image-source');
  const preview = document.getElementById('image-preview');

  // File preview
  fileInput?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
      sourceSelect.value = 'manual';
    }
  });

  // URL preview
  urlInput?.addEventListener('blur', function() {
    if (this.value) {
      preview.src = this.value;
      sourceSelect.value = 'manual';
    }
  });

  // Source change
  sourceSelect?.addEventListener('change', function() {
    if (this.value === 'default') {
      preview.src = '{{ asset("/images/producto-default.svg") }}';
    }
  });
});
</script>
