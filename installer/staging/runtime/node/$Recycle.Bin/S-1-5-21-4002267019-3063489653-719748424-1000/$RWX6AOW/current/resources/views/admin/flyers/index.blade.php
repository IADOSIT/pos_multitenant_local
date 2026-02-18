@extends('layouts.admin', ['title'=>'Flyers','header'=>'Gestión de Flyers'])

@section('content')
<div class="mb-6 flex items-center justify-between">
  <p class="text-gray-600">Administra las imágenes del slider principal de tu tienda</p>
  <a href="{{ route('admin.flyers.create') }}" class="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
    </svg>
    Nuevo Flyer
  </a>
</div>

@if($flyers->isEmpty())
  <div class="bg-white rounded-xl shadow-sm border p-12 text-center">
    <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-gray-800 mb-2">No hay flyers</h3>
    <p class="text-gray-500 mb-6">Crea tu primer flyer para mostrar en el slider de tu tienda</p>
    <a href="{{ route('admin.flyers.create') }}" class="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      Crear Flyer
    </a>
  </div>
@else
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6" x-data="flyerManager()">
    @foreach($flyers as $flyer)
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden group" data-flyer-id="{{ $flyer->id }}">
        <!-- Image Preview -->
        <div class="aspect-video bg-gray-100 relative overflow-hidden">
          <img src="{{ $flyer->imagen_url }}" alt="{{ $flyer->alt_text ?? $flyer->titulo }}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
            <a href="{{ route('admin.flyers.edit', $flyer) }}" class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </a>
            <form method="POST" action="{{ route('admin.flyers.destroy', $flyer) }}" onsubmit="return confirm('¿Eliminar este flyer?')">
              @csrf
              @method('DELETE')
              <button type="submit" class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-red-50 hover:text-red-600 transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </form>
          </div>
          <!-- Status Badge -->
          @if(!$flyer->activo)
            <div class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">Inactivo</div>
          @endif
        </div>

        <!-- Info -->
        <div class="p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-800 truncate">{{ $flyer->titulo ?? 'Sin título' }}</h3>
              <p class="text-sm text-gray-500">Orden: {{ $flyer->orden }}</p>
            </div>
            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium {{ $flyer->activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600' }}">
              <span class="w-1.5 h-1.5 rounded-full {{ $flyer->activo ? 'bg-green-500' : 'bg-gray-400' }}"></span>
              {{ $flyer->activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          @if($flyer->link_url)
            <a href="{{ $flyer->link_url }}" target="_blank" class="mt-2 text-sm text-primary-600 hover:text-primary-700 truncate block">
              {{ Str::limit($flyer->link_url, 40) }}
            </a>
          @endif
        </div>
      </div>
    @endforeach
  </div>

  <div class="mt-6">
    {{ $flyers->links() }}
  </div>
@endif

<script>
function flyerManager() {
  return {
    // Future: drag & drop reordering
  }
}
</script>
@endsection
