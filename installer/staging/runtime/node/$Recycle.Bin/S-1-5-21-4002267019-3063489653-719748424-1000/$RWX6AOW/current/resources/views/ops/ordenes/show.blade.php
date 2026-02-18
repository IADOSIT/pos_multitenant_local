@extends('layouts.admin', ['title'=>'Orden', 'header'=>'Detalle de Orden'])
@section('content')
<div class="grid lg:grid-cols-3 gap-4">
  <div class="lg:col-span-2 bg-white border rounded p-4">
    <div class="flex items-start justify-between">
      <div>
        <div class="text-xs text-gray-500">Orden</div>
        <div class="text-xl font-bold font-mono">{{ $orden->folio ?? ('#'.$orden->id) }}</div>
        <div class="text-sm text-gray-600 mt-1">{{ $orden->comprador_nombre }} · {{ $orden->comprador_whatsapp }}</div>
      </div>
      <div class="text-right">
        <div class="text-xs text-gray-500">Total</div>
        <div class="text-2xl font-bold">${{ number_format($orden->total,2) }}</div>
      </div>
    </div>

    <h2 class="mt-6 font-semibold">Items</h2>
    <div class="mt-2 text-sm divide-y">
      @foreach($orden->items as $it)
        <div class="py-2 flex justify-between">
          <div>{{ $it->nombre ?? $it->producto?->nombre }} <span class="text-gray-500">x{{ $it->cantidad }}</span></div>
          <div class="font-medium">${{ number_format($it->total,2) }}</div>
        </div>
      @endforeach
    </div>

    <h2 class="mt-6 font-semibold">Pagos</h2>
    <div class="mt-2">
      <form method="POST" action="{{ route('ops.pagos.store',$orden->id) }}" class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        @csrf
        <select name="metodo" class="border rounded px-3 py-2">
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="transfer">Transfer</option>
        </select>
        <input name="monto" type="number" step="0.01" class="border rounded px-3 py-2 w-40" placeholder="Monto">
        <input name="referencia" class="border rounded px-3 py-2 flex-1" placeholder="Referencia (opcional)">
        <button class="px-4 py-2 bg-black text-white rounded">Registrar pago</button>
      </form>
      @error('monto')<div class="text-xs text-red-600 mt-1">{{ $message }}</div>@enderror

      <div class="mt-3 border rounded overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="text-left p-3">Fecha</th>
              <th class="text-left p-3">Método</th>
              <th class="text-right p-3">Monto</th>
              <th class="text-left p-3">Status</th>
              <th class="text-left p-3">Ref</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @foreach($orden->pagos as $p)
              <tr>
                <td class="p-3 text-xs text-gray-500">{{ $p->created_at }}</td>
                <td class="p-3">{{ $p->metodo }}</td>
                <td class="p-3 text-right font-bold">${{ number_format($p->monto,2) }}</td>
                <td class="p-3">{{ $p->status }}</td>
                <td class="p-3 text-xs">{{ $p->referencia }}</td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="bg-white border rounded p-4">
    <div class="font-semibold">Estatus</div>
    <div class="mt-2 text-sm">
      Actual: <span class="font-semibold">{{ $orden->status }}</span>
    </div>

    <form method="POST" action="{{ route('ops.ordenes.updateStatus',$orden->id) }}" class="mt-3 space-y-2">
      @csrf
      <select name="status" class="w-full border rounded px-3 py-2">
        @foreach($statuses as $s)
          <option value="{{ $s }}" @selected($orden->status===$s)>{{ $s }}</option>
        @endforeach
      </select>
      <input name="nota" class="w-full border rounded px-3 py-2" placeholder="Nota (opcional)">
      <button class="w-full px-4 py-2 bg-black text-white rounded">Actualizar estatus</button>
    </form>

    <div class="mt-6">
      <div class="font-semibold">WhatsApp</div>
      <form method="POST" action="{{ route('ops.whatsapp.retryLast',$orden->id) }}" class="mt-2">
        @csrf
        <button class="w-full px-4 py-2 border rounded">Reintentar último envío</button>
      </form>
      <form method="POST" action="{{ route('ops.whatsapp.optout',$orden->id) }}" class="mt-2">
        @csrf
        <button class="w-full px-4 py-2 border rounded text-red-700">Marcar opt-out (skipped)</button>
      </form>
    </div>
  </div>
</div>
@endsection
