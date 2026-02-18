@csrf
<div class="grid md:grid-cols-2 gap-4">
  <div>
    <label class="text-xs text-gray-500">Nombre</label>
    <input name="nombre" value="{{ old('nombre', $categoria->nombre ?? '') }}" class="w-full mt-1 border rounded px-3 py-2">
    @error('nombre')<div class="text-xs text-red-600 mt-1">{{ $message }}</div>@enderror
  </div>
  <div>
    <label class="text-xs text-gray-500">Slug</label>
    <input name="slug" value="{{ old('slug', $categoria->slug ?? '') }}" class="w-full mt-1 border rounded px-3 py-2" placeholder="auto si vacío">
  </div>
  <div>
    <label class="text-xs text-gray-500">Orden</label>
    <input name="orden" type="number" value="{{ old('orden', $categoria->orden ?? '') }}" class="w-full mt-1 border rounded px-3 py-2">
  </div>
  <div class="flex items-end">
    <label class="inline-flex items-center gap-2">
      <input type="hidden" name="activa" value="0">
      <input type="checkbox" name="activa" value="1" @checked((bool)old('activa', $categoria->activa ?? true))>
      <span class="text-sm">Activa</span>
    </label>
  </div>
</div>

<div class="mt-5 flex gap-2">
  <button class="px-4 py-2 rounded bg-black text-white">Guardar</button>
  <a href="{{ route('admin.categorias.index') }}" class="px-4 py-2 rounded border">Cancelar</a>
</div>
