@extends('layouts.admin', ['title'=>'Editar Flyer','header'=>'Editar Flyer'])

@section('content')
<div class="max-w-2xl">
  <form method="POST" action="{{ route('admin.flyers.update', $flyer) }}" enctype="multipart/form-data" class="bg-white rounded-xl shadow-sm border p-6" x-data="flyerForm()">
    @csrf
    @method('PUT')

    <!-- Current Image -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Imagen actual</label>
      <div class="aspect-video max-w-md bg-gray-100 rounded-lg overflow-hidden mb-3">
        <img src="{{ $flyer->imagen_url }}" alt="{{ $flyer->alt_text }}" class="w-full h-full object-cover">
      </div>
    </div>

    <!-- New Image Upload -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Nueva imagen (opcional)</label>
      <div class="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-400 transition cursor-pointer"
           @click="$refs.fileInput.click()"
           @dragover.prevent="dragover = true"
           @dragleave="dragover = false"
           @drop.prevent="handleDrop($event)"
           :class="{ 'border-primary-400 bg-primary-50': dragover }">
        <input type="file" name="imagen" accept="image/*" x-ref="fileInput" @change="previewImage($event)" class="hidden">

        <template x-if="!preview">
          <div>
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
            </div>
            <p class="text-sm text-gray-600">Arrastra o selecciona para cambiar imagen</p>
          </div>
        </template>

        <template x-if="preview">
          <div class="relative">
            <img :src="preview" class="max-h-48 mx-auto rounded-lg">
            <button type="button" @click.stop="removePreview()" class="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </template>
      </div>
      @error('imagen')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
      @enderror
    </div>

    <!-- Title -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Título</label>
      <input type="text" name="titulo" value="{{ old('titulo', $flyer->titulo) }}" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition" placeholder="Ej: Ofertas de Temporada">
      @error('titulo')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
      @enderror
    </div>

    <!-- Alt Text -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Texto alternativo (SEO)</label>
      <input type="text" name="alt_text" value="{{ old('alt_text', $flyer->alt_text) }}" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition" placeholder="Descripción de la imagen para SEO">
      @error('alt_text')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
      @enderror
    </div>

    <!-- Link URL -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Enlace (opcional)</label>
      <input type="url" name="link_url" value="{{ old('link_url', $flyer->link_url) }}" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition" placeholder="https://...">
      @error('link_url')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
      @enderror
    </div>

    <!-- Order -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Orden</label>
      <input type="number" name="orden" value="{{ old('orden', $flyer->orden) }}" min="0" class="w-32 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition">
      @error('orden')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
      @enderror
    </div>

    <!-- Active -->
    <div class="mb-6">
      <label class="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="activo" value="1" {{ old('activo', $flyer->activo) ? 'checked' : '' }} class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500">
        <span class="text-sm font-medium text-gray-700">Activo (mostrar en el slider)</span>
      </label>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3 pt-4 border-t">
      <button type="submit" class="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        Actualizar Flyer
      </button>
      <a href="{{ route('admin.flyers.index') }}" class="text-gray-600 hover:text-gray-800 font-medium">Cancelar</a>
    </div>
  </form>

  <!-- Delete Form -->
  <form method="POST" action="{{ route('admin.flyers.destroy', $flyer) }}" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl" onsubmit="return confirm('¿Estás seguro de eliminar este flyer? Esta acción no se puede deshacer.')">
    @csrf
    @method('DELETE')
    <div class="flex items-center justify-between">
      <div>
        <p class="font-medium text-red-800">Eliminar flyer</p>
        <p class="text-sm text-red-600">Esta acción no se puede deshacer</p>
      </div>
      <button type="submit" class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Eliminar
      </button>
    </div>
  </form>
</div>

<script>
function flyerForm() {
  return {
    preview: null,
    dragover: false,

    previewImage(event) {
      const file = event.target.files[0];
      if (file) {
        this.preview = URL.createObjectURL(file);
      }
    },

    handleDrop(event) {
      this.dragover = false;
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.$refs.fileInput.files = event.dataTransfer.files;
        this.preview = URL.createObjectURL(file);
      }
    },

    removePreview() {
      this.preview = null;
      this.$refs.fileInput.value = '';
    }
  }
}
</script>
@endsection
