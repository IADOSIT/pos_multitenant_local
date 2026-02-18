@extends('layouts.admin', ['title' => 'Nuevo Cliente', 'header' => 'Nuevo Cliente'])

@section('content')
<div class="max-w-2xl mx-auto">
    <form action="{{ route('admin.clientes.store') }}" method="POST" class="bg-white rounded-xl shadow-sm border p-6">
        @csrf

        <div class="space-y-5">
            <div>
                <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" name="nombre" id="nombre" value="{{ old('nombre') }}" required
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 @error('nombre') border-red-500 @enderror"
                       placeholder="Nombre del cliente">
                @error('nombre')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label for="whatsapp" class="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input type="text" name="whatsapp" id="whatsapp" value="{{ old('whatsapp') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 @error('whatsapp') border-red-500 @enderror"
                           placeholder="Ej: 8181234567">
                    @error('whatsapp')
                        <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" id="email" value="{{ old('email') }}"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 @error('email') border-red-500 @enderror"
                           placeholder="cliente@ejemplo.com">
                    @error('email')
                        <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                    @enderror
                </div>
            </div>

            <div>
                <label for="direccion" class="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                <textarea name="direccion" id="direccion" rows="2"
                          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 @error('direccion') border-red-500 @enderror"
                          placeholder="Direccion de entrega">{{ old('direccion') }}</textarea>
                @error('direccion')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div>
                <label for="notas" class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea name="notas" id="notas" rows="3"
                          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 @error('notas') border-red-500 @enderror"
                          placeholder="Notas adicionales sobre el cliente">{{ old('notas') }}</textarea>
                @error('notas')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div class="flex items-center gap-3">
                <input type="hidden" name="enviar_estatus" value="0">
                <input type="checkbox" name="enviar_estatus" id="enviar_estatus" value="1"
                       {{ old('enviar_estatus', true) ? 'checked' : '' }}
                       class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500">
                <label for="enviar_estatus" class="text-sm text-gray-700">
                    Enviar actualizaciones de estatus por WhatsApp
                </label>
            </div>
        </div>

        <div class="flex items-center justify-between mt-8 pt-6 border-t">
            <a href="{{ route('admin.clientes.index') }}" class="text-gray-600 hover:text-gray-800">
                &larr; Cancelar
            </a>
            <button type="submit" class="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                Guardar Cliente
            </button>
        </div>
    </form>
</div>
@endsection
