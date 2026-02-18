@extends('layouts.admin', ['title'=>'Importar/Exportar Inventario','header'=>'Importar/Exportar Inventario'])

@section('content')
<div class="max-w-4xl">

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

  <div class="grid md:grid-cols-2 gap-6">
    <!-- Import Section -->
    <div class="bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-800">Importar Inventario</h2>
          <p class="text-sm text-gray-500">Actualizar stock masivamente</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p class="text-sm text-blue-800">Los productos deben existir previamente. Se buscan por SKU o nombre exacto.</p>
              <a href="{{ route('admin.import-export.inventario.template') }}" class="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Descargar plantilla CSV
              </a>
            </div>
          </div>
        </div>

        <form method="POST" action="{{ route('admin.import-export.inventario.preview', $empresas ? ['empresa_id' => $empresaId] : []) }}" enctype="multipart/form-data" class="space-y-4">
          @csrf
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Archivo CSV</label>
            <input type="file" name="file" accept=".csv,.txt" required
              class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium hover:file:bg-primary-100">
            @error('file')
              <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
            @enderror
          </div>

          <button type="submit" class="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Vista previa
          </button>
        </form>

        <div class="text-xs text-gray-500 space-y-1">
          <p><strong>Columnas:</strong> sku, nombre_producto, stock</p>
          <p><strong>Busqueda:</strong> Primero por SKU, luego por nombre exacto</p>
        </div>
      </div>
    </div>

    <!-- Export Section -->
    <div class="bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-800">Exportar Inventario</h2>
          <p class="text-sm text-gray-500">Descarga stock actual</p>
        </div>
      </div>

      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Exporta el inventario actual de tu empresa. Puedes editar el archivo y reimportarlo para actualizar stock masivamente.
        </p>

        <a href="{{ route('admin.import-export.inventario.export', $empresas ? ['empresa_id' => $empresaId] : []) }}" class="w-full inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg font-medium transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Exportar a CSV
        </a>
      </div>
    </div>
  </div>

  <div class="mt-6 flex gap-4">
    <a href="{{ route('admin.import-export.hub') }}" class="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Volver a Importar Catalogos
    </a>
  </div>
</div>
@endsection
