@extends('layouts.admin', ['title'=>'Ordenes', 'header'=>'Ordenes'])

@section('content')
<div class="flex items-center justify-between mb-4">
  <h1 class="text-xl font-semibold">Órdenes</h1>
  <form method="GET" class="flex gap-2">
    <input class="border rounded p-2 text-sm" name="q" value="{{ request('q') }}" placeholder="Folio / WhatsApp">
    <select class="border rounded p-2 text-sm" name="status">
      <option value="">Todos</option>
      @foreach(($statuses ?? []) as $s)
        <option value="{{ $s }}" @selected(request('status')===$s)>{{ $s }}</option>
      @endforeach
    </select>
    <button class="border rounded px-3 text-sm">Buscar</button>
  </form>
</div>

<div class="overflow-x-auto border rounded">
  <table class="min-w-full text-sm">
    <thead>
      <tr class="bg-gray-50">
        <th class="text-left p-2">Folio</th>
        <th class="text-left p-2">Cliente</th>
        <th class="text-left p-2">Status</th>
        <th class="text-right p-2">Total</th>
        <th class="text-left p-2">Fecha</th>
        <th class="text-right p-2"></th>
      </tr>
    </thead>
    <tbody>
      @forelse($ordenes as $o)
        <tr class="border-t">
          <td class="p-2 font-medium">{{ $o->folio ?? ('#'.$o->id) }}</td>
          <td class="p-2">
            <div>{{ $o->comprador_nombre ?? '—' }}</div>
            <div class="text-xs opacity-70">{{ $o->comprador_whatsapp ?? '—' }}</div>
          </td>
          <td class="p-2">{{ $o->status }}</td>
          <td class="p-2 text-right">${{ number_format($o->total,2) }}</td>
          <td class="p-2">{{ optional($o->created_at)->format('Y-m-d H:i') }}</td>
          <td class="p-2 text-right">
            <a class="underline" href="{{ route('ops.ordenes.show',$o) }}">Ver</a>
          </td>
        </tr>
      @empty
        <tr><td class="p-4" colspan="6">Sin resultados.</td></tr>
      @endforelse
    </tbody>
  </table>
</div>

<div class="mt-4">
  {{ $ordenes->links() }}
</div>
@endsection
