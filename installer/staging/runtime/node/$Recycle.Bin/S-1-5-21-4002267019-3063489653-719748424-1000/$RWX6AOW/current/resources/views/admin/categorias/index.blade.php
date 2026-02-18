@extends('layouts.admin', ['title'=>'Categorías','header'=>'Categorías'])

@section('content')
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <div class="flex flex-wrap gap-2 items-center">
    <div class="text-sm text-gray-600">Organiza tu catálogo.</div>
    @if(!empty($empresas) && isset($empresaId))
      <form method="GET" class="flex gap-2">
        <select name="empresa_id" onchange="this.form.submit()" class="border rounded px-3 py-2 text-sm">
          <option value="">Todas las empresas</option>
          @foreach($empresas as $emp)
            <option value="{{ $emp->id }}" {{ $emp->id == request('empresa_id') ? 'selected' : '' }}>{{ $emp->nombre }}</option>
          @endforeach
        </select>
      </form>
    @endif
  </div>
  <a class="px-4 py-2 rounded bg-black text-white" href="{{ route('admin.categorias.create') }}">Nueva</a>
</div>

<div class="bg-white border rounded overflow-hidden">
  <table class="w-full text-sm">
    <thead class="bg-gray-50 border-b">
      <tr>
        <th class="text-left p-3">Nombre</th>
        <th class="text-left p-3">Slug</th>
        @if(!empty($empresas))
          <th class="text-left p-3">Empresa</th>
        @endif
        <th class="text-center p-3">Orden</th>
        <th class="text-center p-3">Activa</th>
        <th class="p-3"></th>
      </tr>
    </thead>
    <tbody class="divide-y">
      @forelse($categorias as $c)
        <tr>
          <td class="p-3 font-medium">{{ $c->nombre }}</td>
          <td class="p-3 text-gray-600">{{ $c->slug }}</td>
          @if(!empty($empresas))
            <td class="p-3 text-xs">
              <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ $c->empresa?->nombre ?? 'ID:'.$c->empresa_id }}</span>
            </td>
          @endif
          <td class="p-3 text-center">{{ $c->orden }}</td>
          <td class="p-3 text-center">{{ $c->activa ? 'Sí' : 'No' }}</td>
          <td class="p-3 text-right">
            <a class="text-blue-700 hover:underline" href="{{ route('admin.categorias.edit',$c->id) }}">Editar</a>
            <form method="POST" action="{{ route('admin.categorias.destroy',$c->id) }}" class="inline">
              @csrf @method('DELETE')
              <button class="text-red-700 hover:underline ml-2" onclick="return confirm('¿Eliminar?')">Eliminar</button>
            </form>
          </td>
        </tr>
      @empty
        <tr>
          <td colspan="{{ !empty($empresas) ? 6 : 5 }}" class="p-8 text-center text-gray-500">No hay categorías</td>
        </tr>
      @endforelse
    </tbody>
  </table>
</div>
@endsection
