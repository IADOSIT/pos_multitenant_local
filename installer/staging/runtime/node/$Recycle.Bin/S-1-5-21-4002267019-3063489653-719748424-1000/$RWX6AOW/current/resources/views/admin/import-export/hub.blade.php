@extends('layouts.admin', ['title'=>'Importar Catalogos','header'=>'Importar Catalogos'])

@section('content')
<div class="max-w-6xl">

  {{-- Empresa selector for superadmin --}}
  @if($empresas)
  <div class="mb-6 bg-white rounded-xl shadow-sm border p-4">
    <form method="GET" class="flex items-center gap-4">
      <label class="text-sm font-medium text-gray-700">Empresa destino:</label>
      <select name="empresa_id" onchange="this.form.submit()" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
        @foreach($empresas as $emp)
          <option value="{{ $emp->id }}" {{ $emp->id == $empresaId ? 'selected' : '' }}>{{ $emp->nombre }}</option>
        @endforeach
      </select>
    </form>
  </div>
  @endif

  {{-- Import Cards Grid --}}
  <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {{-- Productos --}}
    <a href="{{ route('admin.import-export.productos', $empresas ? ['empresa_id' => $empresaId] : []) }}" class="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md hover:border-primary-300 transition group">
      <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      </div>
      <h3 class="font-bold text-gray-800">Productos</h3>
      <p class="text-sm text-gray-500 mt-1">SKU, nombre, precio, categoria</p>
    </a>

    {{-- Categorias --}}
    <a href="{{ route('admin.import-export.categorias', $empresas ? ['empresa_id' => $empresaId] : []) }}" class="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md hover:border-primary-300 transition group">
      <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition">
        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
        </svg>
      </div>
      <h3 class="font-bold text-gray-800">Categorias</h3>
      <p class="text-sm text-gray-500 mt-1">Nombre, orden, descripcion</p>
    </a>

    {{-- Clientes --}}
    <a href="{{ route('admin.import-export.clientes', $empresas ? ['empresa_id' => $empresaId] : []) }}" class="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md hover:border-primary-300 transition group">
      <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      </div>
      <h3 class="font-bold text-gray-800">Clientes</h3>
      <p class="text-sm text-gray-500 mt-1">Nombre, WhatsApp, email</p>
    </a>

    {{-- Inventario --}}
    <a href="{{ route('admin.import-export.inventario', $empresas ? ['empresa_id' => $empresaId] : []) }}" class="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md hover:border-primary-300 transition group">
      <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-200 transition">
        <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
        </svg>
      </div>
      <h3 class="font-bold text-gray-800">Inventario</h3>
      <p class="text-sm text-gray-500 mt-1">Stock por SKU o nombre</p>
    </a>
  </div>

  {{-- Recent imports history --}}
  <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
    <div class="p-4 border-b flex items-center justify-between">
      <div>
        <h2 class="font-bold text-gray-800">Historial de importaciones</h2>
        <p class="text-sm text-gray-500">Ultimas 20 importaciones</p>
      </div>
      @if($imports->count() > 0)
        <a href="{{ route('admin.import-export.history', $empresas ? ['empresa_id' => $empresaId] : []) }}" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Ver todo
        </a>
      @endif
    </div>

    @if($imports->count() > 0)
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Archivo</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
            <th class="px-4 py-3 text-right font-medium text-gray-600">Nuevos</th>
            <th class="px-4 py-3 text-right font-medium text-gray-600">Actualizados</th>
            <th class="px-4 py-3 text-right font-medium text-gray-600">Omitidos</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          @foreach($imports as $imp)
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-500">{{ $imp->created_at->format('d/m/Y H:i') }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                {{ $imp->tipo === 'productos' ? 'bg-blue-100 text-blue-700' : '' }}
                {{ $imp->tipo === 'categorias' ? 'bg-purple-100 text-purple-700' : '' }}
                {{ $imp->tipo === 'clientes' ? 'bg-green-100 text-green-700' : '' }}
                {{ $imp->tipo === 'inventario' ? 'bg-amber-100 text-amber-700' : '' }}
              ">{{ ucfirst($imp->tipo) }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600 truncate max-w-[200px]">{{ $imp->archivo ?? '-' }}</td>
            <td class="px-4 py-3">
              @if($imp->status === 'completed')
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Completado</span>
              @elseif($imp->status === 'failed')
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Error</span>
              @elseif($imp->status === 'processing')
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Procesando</span>
              @else
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Pendiente</span>
              @endif
            </td>
            <td class="px-4 py-3 text-right font-medium text-green-600">{{ $imp->imported }}</td>
            <td class="px-4 py-3 text-right font-medium text-blue-600">{{ $imp->updated }}</td>
            <td class="px-4 py-3 text-right font-medium text-gray-500">{{ $imp->skipped }}</td>
          </tr>
          @endforeach
        </tbody>
      </table>
    </div>
    @else
    <div class="p-8 text-center text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <p>No hay importaciones registradas</p>
    </div>
    @endif
  </div>
</div>
@endsection
