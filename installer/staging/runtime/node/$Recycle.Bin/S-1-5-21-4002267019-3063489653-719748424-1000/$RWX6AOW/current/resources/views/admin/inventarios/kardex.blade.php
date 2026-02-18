@extends('layouts.admin', ['title'=>'Kardex','header'=>'Kardex'])

@section('content')
<div class="bg-white border rounded p-4">
  <div class="flex items-center justify-between">
    <div>
      <div class="font-bold text-lg">{{ $producto->nombre }}</div>
      <div class="text-sm text-gray-600">Stock actual: <span class="font-bold">{{ $stock }}</span></div>
    </div>

    <form method="POST" action="{{ route('admin.inventarios.ajustar',$producto->id) }}" class="flex gap-2 items-center">
      @csrf
      <select name="tipo" class="border rounded px-2 py-2 text-sm">
        <option value="ajuste">Ajuste</option>
        <option value="merma">Merma</option>
        <option value="compra">Compra</option>
      </select>
      <input name="cantidad" type="number" class="border rounded px-2 py-2 w-28 text-sm" placeholder="Cantidad">
      <input name="nota" class="border rounded px-2 py-2 w-56 text-sm" placeholder="Nota (opcional)">
      <button class="px-3 py-2 rounded bg-black text-white text-sm">Aplicar</button>
    </form>
  </div>

  <div class="mt-4 border rounded overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b">
        <tr>
          <th class="text-left p-3">Fecha</th>
          <th class="text-left p-3">Tipo</th>
          <th class="text-right p-3">Cantidad</th>
          <th class="text-left p-3">Ref</th>
          <th class="text-left p-3">Nota</th>
        </tr>
      </thead>
      <tbody class="divide-y">
        @foreach($movs as $m)
          <tr>
            <td class="p-3">{{ $m->created_at }}</td>
            <td class="p-3">{{ $m->tipo }}</td>
            <td class="p-3 text-right font-bold">{{ $m->cantidad }}</td>
            <td class="p-3 text-xs text-gray-500">{{ $m->ref_tipo }} #{{ $m->ref_id }}</td>
            <td class="p-3 text-xs">{{ data_get($m->meta,'nota') }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  </div>
</div>
@endsection
