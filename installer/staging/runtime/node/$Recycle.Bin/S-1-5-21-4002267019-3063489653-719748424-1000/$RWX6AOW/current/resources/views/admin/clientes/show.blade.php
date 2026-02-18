@extends('layouts.admin', ['title'=>'Cliente','header'=>'Cliente'])

@section('content')
<div class="bg-white border rounded p-4">
  <div class="text-lg font-bold">{{ $cliente->nombre }}</div>
  <div class="text-sm text-gray-600 mt-1">{{ $cliente->whatsapp }} · {{ $cliente->email }}</div>
  <div class="mt-3 text-sm">
    Enviar estatus WhatsApp: <span class="font-semibold">{{ $cliente->enviar_estatus ? 'Sí' : 'No' }}</span>
  </div>

  <h2 class="mt-6 font-semibold">Órdenes</h2>
  <div class="mt-2 text-sm divide-y">
    @foreach($ordenes as $o)
      <div class="py-2 flex justify-between">
        <div>
          <div class="font-medium">{{ $o->folio ?? ('#'.$o->id) }}</div>
          <div class="text-xs text-gray-500">{{ $o->status }} · {{ $o->created_at }}</div>
        </div>
        <div class="font-bold">${{ number_format($o->total,2) }}</div>
      </div>
    @endforeach
  </div>
</div>
@endsection
