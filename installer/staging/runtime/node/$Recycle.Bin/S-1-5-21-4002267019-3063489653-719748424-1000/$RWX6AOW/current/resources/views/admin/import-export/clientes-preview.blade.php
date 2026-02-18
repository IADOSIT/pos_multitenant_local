@extends('layouts.admin', ['title'=>'Vista previa - Clientes','header'=>'Vista previa de importacion'])

@section('content')
<div class="max-w-6xl">
  <div class="grid md:grid-cols-3 gap-4 mb-6">
    <div class="bg-white rounded-xl shadow-sm border p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-800">{{ count($rows) }}</p>
          <p class="text-sm text-gray-500">Total filas</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-green-600">{{ count($validRows) }}</p>
          <p class="text-sm text-gray-500">Validas</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-red-600">{{ count($invalidRows) }}</p>
          <p class="text-sm text-gray-500">Con errores</p>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
    <div class="p-4 border-b">
      <h2 class="font-bold text-gray-800">Vista previa de datos</h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Linea</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">WhatsApp</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Email</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          @foreach($rows as $row)
            <tr class="{{ !empty($row['_errors']) ? 'bg-red-50' : '' }}">
              <td class="px-4 py-3 text-gray-500">{{ $row['_line'] }}</td>
              <td class="px-4 py-3 font-medium">
                {{ $row['nombre'] ?? '-' }}
                @if(!empty($row['_errors']))
                  <div class="text-xs text-red-600 mt-1">
                    @foreach($row['_errors'] as $err)
                      <span>{{ $err }}</span>@if(!$loop->last), @endif
                    @endforeach
                  </div>
                @endif
              </td>
              <td class="px-4 py-3 font-mono text-xs">{{ $row['whatsapp'] ?? '-' }}</td>
              <td class="px-4 py-3">{{ $row['email'] ?? '-' }}</td>
              <td class="px-4 py-3">
                @if(!empty($row['_errors']))
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Error</span>
                @else
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">OK</span>
                @endif
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>
  </div>

  <div class="mt-6 flex items-center justify-between">
    <a href="{{ route('admin.import-export.clientes') }}" class="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Cancelar y volver
    </a>

    @if(count($validRows) > 0)
      <form method="POST" action="{{ route('admin.import-export.clientes.import') }}">
        @csrf
        <button type="submit" class="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Importar {{ count($validRows) }} clientes
        </button>
      </form>
    @else
      <p class="text-red-600 font-medium">No hay filas validas para importar</p>
    @endif
  </div>
</div>
@endsection
