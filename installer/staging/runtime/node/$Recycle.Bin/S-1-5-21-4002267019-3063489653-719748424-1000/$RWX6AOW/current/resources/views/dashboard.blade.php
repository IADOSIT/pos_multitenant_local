@extends('layouts.admin')

@section('content')
<div class="rounded-xl bg-white border p-5">
  <div class="text-xl font-semibold">Dashboard</div>
  <div class="text-sm text-slate-500">Accesos rápidos</div>

  <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
    <a class="rounded-xl border bg-slate-50 p-4 hover:bg-white" href="{{ route('admin.dashboard') }}">
      <div class="text-sm text-slate-500">Admin</div>
      <div class="font-semibold">Ventas / Catálogo</div>
    </a>
    <a class="rounded-xl border bg-slate-50 p-4 hover:bg-white" href="{{ route('ops.ordenes.index') }}">
      <div class="text-sm text-slate-500">Operaciones</div>
      <div class="font-semibold">Órdenes del día</div>
    </a>
    <a class="rounded-xl border bg-slate-50 p-4 hover:bg-white" href="{{ route('store.home') }}">
      <div class="text-sm text-slate-500">Tienda</div>
      <div class="font-semibold">Ver storefront</div>
    </a>
  </div>
</div>
@endsection
