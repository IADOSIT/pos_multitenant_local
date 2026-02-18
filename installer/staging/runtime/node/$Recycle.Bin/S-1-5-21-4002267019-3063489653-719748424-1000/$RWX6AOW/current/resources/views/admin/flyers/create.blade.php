@extends('layouts.admin', ['title'=>'Nuevo Flyer','header'=>'Nuevo Flyer'])

@section('content')
<div class="max-w-2xl">
  <form method="POST" action="{{ route('admin.flyers.store') }}" enctype="multipart/form-data" class="bg-white rounded-xl shadow-sm border p-6" x-data="flyerForm()">
    @csrf

    <!-- Image Upload -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Imagen del Flyer <span class="text-red-500">*</span></label>
      <div class="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-400 transition cursor-pointer"
           @click="$refs.fileInput.click()"
           @dragover.prevent="dragover = true"
           @dragleave="dragover = false"
           @drop.prevent="handleDrop($event)"
           :class="{ 'border-primary-400 bg-primary-50': dragover }">
        <input type="file" name="imagen" accept="image/*" required x-ref="fileInput" @change="previewImage($event)" class="hidden">

        <template x-if="!preview">
          <div>
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-gray-600">Arrastra una imagen o haz clic para seleccionar</p>
            <p class="text-sm text-gray-400 mt-1">JPG, PNG, GIF, WEBP (máx. 5MB)</p>
          </div>
        </template>

        <template x-if="preview">
          <div class="relative">
            <img :src="preview" class="max-h-64 mx-auto rounded-lg">
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
      <input type="text" name="titulo" value="{{ old('titulo') }}" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition" placeholder="Ej: Ofertas de Temporada">
      @error('titulo')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
      @enderror
    </div>

    <!-- Alt Text -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Texto alternativo (SEO)</label>
      <input type="text" name="alt_text" value="{{ old('alt_text') }}" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition" placeholder="Descripción de la imagen para SEO">
      <p class="mt-1 text-xs text-gray-500">Describe la imagen para mejorar accesibilidad y SEO</p>
      @error('alt_text')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
      @enderror
    </div>

    <!-- Link URL -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Enlace (opcional)</label>
      <input type="url" name="link_url" value="{{ old('link_url') }}" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition" placeholder="https://...">
      <p class="mt-1 text-xs text-gray-500">URL a donde llevará el clic en el flyer</p>
      @error('link_url')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
      @enderror
    </div>

    <!-- Order -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Orden</label>
      <input type="number" name="orden" value="{{ old('orden', 0) }}" min="0" class="w-32 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition">
      <p class="mt-1 text-xs text-gray-500">Posición en el slider (menor = primero)</p>
      @error('orden')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
      @enderror
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3 pt-4 border-t">
      <button type="submit" class="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        Guardar Flyer
      </button>
      <a href="{{ route('admin.flyers.index') }}" class="text-gray-600 hover:text-gray-800 font-medium">Cancelar</a>
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
