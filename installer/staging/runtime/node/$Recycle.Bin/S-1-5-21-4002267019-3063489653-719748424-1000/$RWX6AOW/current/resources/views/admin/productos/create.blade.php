@extends('layouts.admin')

@section('content')
<div class="max-w-3xl mx-auto p-4">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl font-semibold">Crear producto</h1>
    <a class="text-sm underline" href="{{ route('admin.productos.index') }}">Volver</a>
  </div>

  @if ($errors->any())
    <div class="mb-4 rounded border p-3">
      <ul class="list-disc pl-5 text-sm">
        @foreach ($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <form method="POST" action="{{ route('admin.productos.store') }}" class="space-y-4">
    @csrf

    <div>
      <label class="block text-sm font-medium mb-1">Nombre</label>
      <input class="w-full border rounded p-2" name="nombre" value="{{ old('nombre') }}" required>
    </div>

    <div>
      <label class="block text-sm font-medium mb-1">SKU</label>
      <input class="w-full border rounded p-2" name="sku" value="{{ old('sku') }}">
    </div>

    <div>
      <label class="block text-sm font-medium mb-1">Categoría</label>
      <select class="w-full border rounded p-2" name="categoria_id">
        <option value="">—</option>
        @foreach(($categorias ?? []) as $c)
          <option value="{{ $c->id }}" @selected(old('categoria_id')==$c->id)>{{ $c->nombre }}</option>
        @endforeach
      </select>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium mb-1">Precio</label>
        <input class="w-full border rounded p-2" name="precio" value="{{ old('precio') }}" inputmode="decimal" required>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Stock (opcional)</label>
        <input class="w-full border rounded p-2" name="stock" value="{{ old('stock') }}" inputmode="numeric">
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium mb-1">Descripción</label>
      <textarea class="w-full border rounded p-2" rows="4" name="descripcion">{{ old('descripcion') }}</textarea>
    </div>

    <div class="flex items-center gap-2">
      <!-- Fix: checkbox unchecked sends nothing -->
      <input type="hidden" name="activo" value="0">
      <input type="checkbox" name="activo" value="1" id="activo" @checked(old('activo',1)==1)>
      <label for="activo" class="text-sm">Activo</label>
    </div>

    <div class="pt-2">
      <button class="px-4 py-2 rounded bg-black text-white">Guardar</button>
    </div>
  </form>
</div>
@endsection
