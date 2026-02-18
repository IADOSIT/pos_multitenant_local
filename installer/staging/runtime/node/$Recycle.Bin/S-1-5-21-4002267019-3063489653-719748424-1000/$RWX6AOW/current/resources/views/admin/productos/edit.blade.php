@extends('layouts.admin')

@section('content')
<div class="rounded-xl bg-white border p-5 max-w-3xl">
  <div class="text-xl font-semibold">Editar producto</div>

  <form method="POST" action="{{ route('admin.productos.update',$producto->id) }}" class="mt-4 space-y-4">
    @csrf
    @method('PUT')

    <div>
      <label class="text-sm text-slate-600">Nombre</label>
      <input class="mt-1 w-full rounded-lg border px-3 py-2" name="nombre" value="{{ old('nombre',$producto->nombre) }}" required>
      @error('nombre')<div class="text-sm text-red-600 mt-1">{{ $message }}</div>@enderror
    </div>

    <div>
      <label class="text-sm text-slate-600">Descripción</label>
      <textarea class="mt-1 w-full rounded-lg border px-3 py-2" rows="3" name="descripcion">{{ old('descripcion',$producto->descripcion) }}</textarea>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="text-sm text-slate-600">Categoría</label>
        <select class="mt-1 w-full rounded-lg border px-3 py-2" name="categoria_id">
          <option value="">—</option>
          @foreach($categorias as $c)
            <option value="{{ $c->id }}" @selected(old('categoria_id',$producto->categoria_id)==$c->id)>{{ $c->nombre }}</option>
          @endforeach
        </select>
      </div>
      <div>
        <label class="text-sm text-slate-600">Precio</label>
        <input class="mt-1 w-full rounded-lg border px-3 py-2" name="precio" value="{{ old('precio',$producto->precio) }}" required>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <input type="hidden" name="activo" value="0">
      <input type="checkbox" name="activo" value="1" @checked(old('activo',$producto->activo))>
      <span class="text-sm">Activo</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <button class="rounded-lg bg-emerald-600 text-white px-4 py-2">Guardar</button>
      <a class="rounded-lg border px-4 py-2" href="{{ route('admin.productos.index') }}">Volver</a>
      <form method="POST" action="{{ route('admin.productos.destroy',$producto->id) }}" onsubmit="return confirm('¿Eliminar producto?')">
        @csrf
        @method('DELETE')
        <button class="rounded-lg border px-4 py-2" type="submit">Eliminar</button>
      </form>
    </div>
  </form>
</div>
@endsection
