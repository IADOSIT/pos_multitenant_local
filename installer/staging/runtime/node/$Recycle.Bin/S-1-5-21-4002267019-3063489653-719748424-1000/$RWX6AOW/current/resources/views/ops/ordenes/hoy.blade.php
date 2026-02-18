@extends('layouts.admin', ['title'=>'Lista del día', 'header'=>'Lista del día'])
@section('content')
<div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between mb-4">
  <div>
    <div class="text-lg font-bold">Lista del día</div>
    <div class="text-xs text-gray-500">{{ $date }}</div>
  </div>
  <form method="GET" class="flex gap-2">
    <input name="q" value="{{ $search }}" class="border rounded px-3 py-2 w-72" placeholder="Folio / WhatsApp">
    <button class="px-4 py-2 bg-gray-900 text-white rounded">Buscar</button>
  </form>
</div>

<div class="bg-white border rounded overflow-hidden">
  <table class="w-full text-sm">
    <thead class="bg-gray-50 border-b">
      <tr>
        <th class="text-left p-3">Folio</th>
        <th class="text-left p-3">Cliente</th>
        <th class="text-left p-3">Estatus</th>
        <th class="text-right p-3">Total</th>
        <th class="p-3"></th>
      </tr>
    </thead>
    <tbody class="divide-y">
      @foreach($ordenes as $o)
        <tr>
          <td class="p-3 font-mono">{{ $o->folio ?? ('#'.$o->id) }}</td>
          <td class="p-3">
            <div class="font-medium">{{ $o->comprador_nombre }}</div>
            <div class="text-xs text-gray-500">{{ $o->comprador_whatsapp }}</div>
          </td>
          <td class="p-3"><span class="px-2 py-1 rounded bg-gray-100 text-xs">{{ $o->status }}</span></td>
          <td class="p-3 text-right font-bold">${{ number_format($o->total,2) }}</td>
          <td class="p-3 text-right">
            <a class="text-blue-700 hover:underline" href="{{ route('ops.ordenes.show',$o->id) }}">Abrir</a>
          </td>
        </tr>
      @endforeach
    </tbody>
  </table>
</div>
@endsection
