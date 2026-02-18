@extends('layouts.admin', ['title'=>'Operaciones', 'header'=>'Centro de Operaciones'])
@section('content')
<div class="grid md:grid-cols-3 gap-4">
  <a class="bg-white border rounded p-4 hover:bg-gray-50" href="{{ route('ops.ordenes.hoy') }}">
    <div class="font-semibold">Lista del día</div>
    <div class="text-xs text-gray-500 mt-1">Órdenes de hoy, acciones rápidas.</div>
  </a>
  <a class="bg-white border rounded p-4 hover:bg-gray-50" href="{{ route('ops.ordenes.index') }}">
    <div class="font-semibold">Órdenes</div>
    <div class="text-xs text-gray-500 mt-1">Búsqueda y filtros.</div>
  </a>
  <a class="bg-white border rounded p-4 hover:bg-gray-50" href="{{ route('ops.whatsapp.index') }}">
    <div class="font-semibold">WhatsApp</div>
    <div class="text-xs text-gray-500 mt-1">Reintentar fallidos / revisar logs.</div>
  </a>
</div>
@endsection
