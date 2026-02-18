@extends('layouts.admin', ['title'=>'Inventario','header'=>'Inventario'])

@section('content')
<div class="bg-white border rounded p-4 mb-4">
  <form class="flex flex-wrap gap-2" method="GET">
    @if(!empty($empresas) && isset($empresaId))
      <select name="empresa_id" onchange="this.form.submit()" class="border rounded px-3 py-2 text-sm">
        <option value="">Todas las empresas</option>
        @foreach($empresas as $emp)
          <option value="{{ $emp->id }}" {{ $emp->id == request('empresa_id') ? 'selected' : '' }}>{{ $emp->nombre }}</option>
        @endforeach
      </select>
    @endif
    <input name="q" value="{{ $search }}" class="border rounded px-3 py-2 w-72" placeholder="Buscar producto">
    <button class="px-4 py-2 bg-gray-900 text-white rounded">Buscar</button>
  </form>
</div>

<div class="bg-white border rounded overflow-hidden">
  <table class="w-full text-sm">
    <thead class="bg-gray-50 border-b">
      <tr>
        <th class="text-left p-3">Producto</th>
        @if(!empty($empresas))
          <th class="text-left p-3">Empresa</th>
        @endif
        <th class="text-right p-3">Stock</th>
        <th class="p-3"></th>
      </tr>
    </thead>
    <tbody class="divide-y">
      @forelse($rows as $r)
        <tr>
          <td class="p-3 font-medium">{{ $r['producto']->nombre }}</td>
          @if(!empty($empresas))
            <td class="p-3 text-xs">
              <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ $r['producto']->empresa?->nombre ?? 'ID:'.$r['producto']->empresa_id }}</span>
            </td>
          @endif
          <td class="p-3 text-right font-bold">{{ $r['stock'] }}</td>
          <td class="p-3 text-right">
            <a class="text-blue-700 hover:underline" href="{{ route('admin.inventarios.kardex',$r['producto']->id) }}">Kardex</a>
          </td>
        </tr>
      @empty
        <tr>
          <td colspan="{{ !empty($empresas) ? 4 : 3 }}" class="p-8 text-center text-gray-500">No hay productos</td>
        </tr>
      @endforelse
    </tbody>
  </table>
</div>

<div class="mt-4">{{ $productos->links() }}</div>
@endsection
