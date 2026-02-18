@extends('layouts.admin', ['title'=>'Historial Caja','header'=>'Historial Caja'])

@section('content')
<div class="bg-white border rounded p-4 mb-4">
  <form class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center" method="GET">
    <input name="from" value="{{ request('from') }}" class="border rounded px-3 py-2" placeholder="Desde (YYYY-MM-DD)">
    <input name="to" value="{{ request('to') }}" class="border rounded px-3 py-2" placeholder="Hasta (YYYY-MM-DD)">
    <select name="metodo" class="border rounded px-3 py-2">
      <option value="">Método (todos)</option>
      <option value="cash" @selected(request('metodo')==='cash')>Efectivo</option>
      <option value="card" @selected(request('metodo')==='card')>Tarjeta</option>
      <option value="transfer" @selected(request('metodo')==='transfer')>Transfer</option>
    </select>
    <button class="px-4 py-2 bg-gray-900 text-white rounded">Filtrar</button>
  </form>
</div>

<div class="bg-white border rounded overflow-hidden">
  <table class="w-full text-sm">
    <thead class="bg-gray-50 border-b">
      <tr>
        <th class="text-left p-3">Fecha</th>
        <th class="text-left p-3">Turno</th>
        <th class="text-left p-3">Tipo</th>
        <th class="text-left p-3">Método</th>
        <th class="text-right p-3">Monto</th>
        <th class="text-left p-3">Nota</th>
      </tr>
    </thead>
    <tbody class="divide-y">
      @foreach($movs as $m)
        <tr>
          <td class="p-3">{{ $m->created_at }}</td>
          <td class="p-3">#{{ $m->turno_id }}</td>
          <td class="p-3">{{ $m->tipo }}</td>
          <td class="p-3">{{ $m->metodo }}</td>
          <td class="p-3 text-right font-bold">${{ number_format($m->monto,2) }}</td>
          <td class="p-3 text-xs">{{ $m->nota }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
</div>

<div class="mt-4">{{ $movs->links() }}</div>
@endsection
