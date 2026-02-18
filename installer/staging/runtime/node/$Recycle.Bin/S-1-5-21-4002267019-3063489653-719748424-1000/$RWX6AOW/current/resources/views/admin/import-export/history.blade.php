@extends('layouts.admin', ['title'=>'Historial de Importaciones','header'=>'Historial de Importaciones'])

@section('content')
<div class="max-w-6xl">

  @if($empresas)
  <div class="mb-6 bg-white rounded-xl shadow-sm border p-4">
    <form method="GET" class="flex items-center gap-4">
      <label class="text-sm font-medium text-gray-700">Empresa:</label>
      <select name="empresa_id" onchange="this.form.submit()" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
        @foreach($empresas as $emp)
          <option value="{{ $emp->id }}" {{ $emp->id == $empresaId ? 'selected' : '' }}>{{ $emp->nombre }}</option>
        @endforeach
      </select>
    </form>
  </div>
  @endif

  <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-600">ID</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Archivo</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
            <th class="px-4 py-3 text-right font-medium text-gray-600">Total</th>
            <th class="px-4 py-3 text-right font-medium text-gray-600">Nuevos</th>
            <th class="px-4 py-3 text-right font-medium text-gray-600">Actualizados</th>
            <th class="px-4 py-3 text-right font-medium text-gray-600">Omitidos</th>
            <th class="px-4 py-3 text-right font-medium text-gray-600">Errores</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          @forelse($imports as $imp)
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-400 font-mono text-xs">#{{ $imp->id }}</td>
            <td class="px-4 py-3 text-gray-500">{{ $imp->created_at->format('d/m/Y H:i') }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                {{ $imp->tipo === 'productos' ? 'bg-blue-100 text-blue-700' : '' }}
                {{ $imp->tipo === 'categorias' ? 'bg-purple-100 text-purple-700' : '' }}
                {{ $imp->tipo === 'clientes' ? 'bg-green-100 text-green-700' : '' }}
                {{ $imp->tipo === 'inventario' ? 'bg-amber-100 text-amber-700' : '' }}
              ">{{ ucfirst($imp->tipo) }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600 truncate max-w-[180px]">{{ $imp->archivo ?? '-' }}</td>
            <td class="px-4 py-3">
              @if($imp->status === 'completed')
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Completado</span>
              @elseif($imp->status === 'failed')
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700" title="{{ implode(', ', $imp->error_details ?? []) }}">Error</span>
              @else
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{{ ucfirst($imp->status) }}</span>
              @endif
            </td>
            <td class="px-4 py-3 text-right">{{ $imp->total_rows }}</td>
            <td class="px-4 py-3 text-right font-medium text-green-600">{{ $imp->imported }}</td>
            <td class="px-4 py-3 text-right font-medium text-blue-600">{{ $imp->updated }}</td>
            <td class="px-4 py-3 text-right text-gray-500">{{ $imp->skipped }}</td>
            <td class="px-4 py-3 text-right {{ $imp->errors > 0 ? 'text-red-600 font-medium' : 'text-gray-400' }}">{{ $imp->errors }}</td>
          </tr>
          @empty
          <tr>
            <td colspan="10" class="px-4 py-8 text-center text-gray-400">No hay importaciones registradas</td>
          </tr>
          @endforelse
        </tbody>
      </table>
    </div>

    @if($imports->hasPages())
    <div class="p-4 border-t">
      {{ $imports->withQueryString()->links() }}
    </div>
    @endif
  </div>

  <div class="mt-6">
    <a href="{{ route('admin.import-export.hub') }}" class="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Volver a Importar Catalogos
    </a>
  </div>
</div>
@endsection
