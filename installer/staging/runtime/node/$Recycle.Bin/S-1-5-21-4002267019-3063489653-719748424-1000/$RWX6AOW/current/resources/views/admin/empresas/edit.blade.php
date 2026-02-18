@extends('layouts.admin', ['title' => 'Editar Empresa', 'header' => 'Editar Empresa'])

@section('content')
<div class="max-w-4xl">
    <div class="mb-6">
        <a href="{{ route('admin.empresas.index') }}" class="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver a Empresas
        </a>
    </div>

    <form method="POST" action="{{ route('admin.empresas.update', $empresa->id) }}" enctype="multipart/form-data" class="space-y-6">
        @csrf
        @method('PUT')

        <!-- Tabs -->
        <div x-data="{ tab: 'branding' }" class="bg-white rounded-lg shadow">
            <div class="border-b">
                <nav class="flex -mb-px">
                    <button type="button" @click="tab = 'branding'"
                            :class="tab === 'branding' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                            class="py-4 px-6 border-b-2 font-medium text-sm">
                        Branding
                    </button>
                    <button type="button" @click="tab = 'pagos'"
                            :class="tab === 'pagos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                            class="py-4 px-6 border-b-2 font-medium text-sm">
                        Pagos
                    </button>
                    <button type="button" @click="tab = 'catalogo'"
                            :class="tab === 'catalogo' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                            class="py-4 px-6 border-b-2 font-medium text-sm">
                        Catalogo
                    </button>
                    <button type="button" @click="tab = 'pickup'"
                            :class="tab === 'pickup' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                            class="py-4 px-6 border-b-2 font-medium text-sm">
                        Pickup / Horarios
                    </button>
                </nav>
            </div>

            <!-- Branding Tab -->
            <div x-show="tab === 'branding'" class="p-6 space-y-4">
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre interno *</label>
                        <input type="text" name="nombre" value="{{ old('nombre', $empresa->nombre) }}" required
                               class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                        <input type="text" name="slug" value="{{ old('slug', $empresa->slug) }}"
                               class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                    </div>
                </div>

                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre comercial (display)</label>
                        <input type="text" name="brand_nombre_publico" value="{{ old('brand_nombre_publico', $empresa->brand_nombre_publico) }}"
                               class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del sistema (app_name)</label>
                        <input type="text" name="app_name" value="{{ old('app_name', $empresa->getSetting('app_name')) }}"
                               class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email de soporte</label>
                    <input type="email" name="support_email" value="{{ old('support_email', $empresa->support_email) }}"
                           class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                           placeholder="soporte@tuempresa.com">
                    <p class="text-xs text-gray-500 mt-1">Se usa como reply-to en correos de recuperacion de contrasena</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                    @if($empresa->logo_path)
                        <div class="mb-2 flex items-center gap-3">
                            <img src="{{ asset('storage/' . $empresa->logo_path) }}" class="h-16 w-auto rounded">
                            <label class="flex items-center text-sm text-gray-600">
                                <input type="checkbox" name="remove_logo" value="1" class="mr-2">
                                Eliminar logo actual
                            </label>
                        </div>
                    @endif
                    <input type="file" name="logo" accept="image/*"
                           class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                </div>

                <div class="grid md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
                        <input type="color" name="primary_color" value="{{ old('primary_color', $empresa->getSetting('primary_color') ?? '#16a34a') }}"
                               class="w-full h-10 border rounded-lg cursor-pointer">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Color secundario</label>
                        <input type="color" name="secondary_color" value="{{ old('secondary_color', $empresa->getSetting('secondary_color') ?? '#6b7280') }}"
                               class="w-full h-10 border rounded-lg cursor-pointer">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Color acento</label>
                        <input type="color" name="accent_color" value="{{ old('accent_color', $empresa->getSetting('accent_color') ?? '#3b82f6') }}"
                               class="w-full h-10 border rounded-lg cursor-pointer">
                    </div>
                </div>

                <div x-data="{ selectedTheme: {{ $empresa->theme_id ?? 'null' }} }">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Plantilla / Tema</label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <label class="relative cursor-pointer">
                            <input type="radio" name="theme_id" value="" class="sr-only peer" {{ !$empresa->theme_id ? 'checked' : '' }} @change="selectedTheme = null">
                            <div class="p-3 border-2 rounded-lg peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:bg-gray-50 transition">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="w-4 h-4 rounded-full bg-gray-300"></div>
                                    <span class="text-sm font-medium">Sin tema</span>
                                </div>
                                <div class="text-xs text-gray-500">Usa colores personalizados</div>
                            </div>
                        </label>
                        @foreach($themes as $theme)
                        <label class="relative cursor-pointer">
                            <input type="radio" name="theme_id" value="{{ $theme->id }}" class="sr-only peer" {{ $empresa->theme_id == $theme->id ? 'checked' : '' }} @change="selectedTheme = {{ $theme->id }}">
                            <div class="p-3 border-2 rounded-lg peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:bg-gray-50 transition">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="w-4 h-4 rounded-full" style="background-color: {{ $theme->primary_color }}"></div>
                                    <span class="text-sm font-medium">{{ $theme->nombre }}</span>
                                </div>
                                <div class="flex gap-1">
                                    <div class="w-6 h-3 rounded" style="background-color: {{ $theme->primary_color }}"></div>
                                    <div class="w-6 h-3 rounded" style="background-color: {{ $theme->secondary_color }}"></div>
                                    <div class="w-6 h-3 rounded" style="background-color: {{ $theme->accent_color }}"></div>
                                </div>
                            </div>
                        </label>
                        @endforeach
                    </div>

                    <!-- Theme Preview -->
                    <div class="mt-4 p-4 rounded-lg border bg-gray-50">
                        <div class="text-xs font-medium text-gray-500 mb-2">Vista previa</div>
                        <div class="flex items-center gap-4">
                            <div class="flex-1 h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                                 :style="'background-color: ' + (selectedTheme === null ? '{{ $empresa->getPrimaryColor() }}' : '{{ $themes->first()?->primary_color ?? '#16a34a' }}')">
                                Botón primario
                            </div>
                            <div class="flex-1 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium"
                                 :style="'border-color: ' + (selectedTheme === null ? '{{ $empresa->getPrimaryColor() }}' : '{{ $themes->first()?->primary_color ?? '#16a34a' }}'); color: ' + (selectedTheme === null ? '{{ $empresa->getPrimaryColor() }}' : '{{ $themes->first()?->primary_color ?? '#16a34a' }}')">
                                Botón secundario
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center">
                    <input type="checkbox" name="activa" value="1" {{ $empresa->activa ? 'checked' : '' }} id="activa"
                           class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                    <label for="activa" class="ml-2 text-sm text-gray-700">Empresa activa</label>
                </div>
            </div>

            <!-- Pagos Tab -->
            <div x-show="tab === 'pagos'" x-cloak class="p-6 space-y-4">
                @if($empresa->hasMercadoPago())
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div class="flex items-center gap-2 text-green-800">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            <span class="font-medium">MercadoPago configurado</span>
                        </div>
                    </div>
                @endif

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                    <input type="password" name="mp_access_token" value="{{ old('mp_access_token', $empresa->getSetting('mp_access_token')) }}"
                           class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                           placeholder="APP_USR-...">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                    <input type="text" name="mp_public_key" value="{{ old('mp_public_key', $empresa->getSetting('mp_public_key')) }}"
                           class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                           placeholder="APP_USR-...">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Webhook Secret (opcional)</label>
                    <input type="text" name="mp_webhook_secret" value="{{ old('mp_webhook_secret', $empresa->getSetting('mp_webhook_secret')) }}"
                           class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm">
                </div>
            </div>

            <!-- Catalogo Tab -->
            <div x-show="tab === 'catalogo'" x-cloak class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">URL imagen default para productos</label>
                    <input type="url" name="default_product_image_url"
                           value="{{ old('default_product_image_url', $empresa->getSetting('default_product_image_url')) }}"
                           class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                           placeholder="https://...">
                </div>
            </div>

            <!-- Pickup Tab -->
            <div x-show="tab === 'pickup'" x-cloak class="p-6 space-y-6">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-sm text-blue-800">
                        Configura las opciones de entrega disponibles para los clientes de esta tienda.
                    </p>
                </div>

                <!-- Fulfillment Options -->
                <div class="bg-white border rounded-lg p-4">
                    <h4 class="font-medium text-gray-800 mb-4">Opciones de Entrega</h4>
                    <div class="grid md:grid-cols-2 gap-4">
                        <label class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="enable_pickup" value="1"
                                   {{ old('enable_pickup', $empresa->enable_pickup ?? true) ? 'checked' : '' }}
                                   class="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                            <div>
                                <div class="font-medium text-gray-800">Recoger en tienda (Pickup)</div>
                                <div class="text-sm text-gray-500">El cliente recoge su pedido en la tienda</div>
                            </div>
                        </label>
                        <label class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="enable_delivery" value="1"
                                   {{ old('enable_delivery', $empresa->enable_delivery ?? true) ? 'checked' : '' }}
                                   class="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                            <div>
                                <div class="font-medium text-gray-800">Envio a domicilio (Delivery)</div>
                                <div class="text-sm text-gray-500">Se envia el pedido a la direccion del cliente</div>
                            </div>
                        </label>
                    </div>
                    <p class="text-xs text-gray-500 mt-3">Si solo habilitas una opcion, se seleccionara automaticamente en el checkout.</p>
                </div>

                <!-- Schedule -->
                <div class="bg-white border rounded-lg p-4">
                    <h4 class="font-medium text-gray-800 mb-4">Horario de Atencion</h4>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                            <input type="time" name="hora_atencion_inicio"
                                   value="{{ old('hora_atencion_inicio', $empresa->hora_atencion_inicio ?? '08:00') }}"
                                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                            <input type="time" name="hora_atencion_fin"
                                   value="{{ old('hora_atencion_fin', $empresa->hora_atencion_fin ?? '18:00') }}"
                                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                        </div>
                    </div>
                </div>

                <!-- Pickup ETA -->
                <div class="bg-white border rounded-lg p-4">
                    <h4 class="font-medium text-gray-800 mb-4">Tiempo de Preparacion (Pickup)</h4>
                    <div class="max-w-xs">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Horas estimadas</label>
                        <input type="number" name="pickup_eta_hours" step="0.5" min="0" max="72"
                               value="{{ old('pickup_eta_hours', $empresa->pickup_eta_hours ?? 2) }}"
                               class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                        <p class="text-xs text-gray-500 mt-1">Tiempo promedio para preparar un pedido</p>
                    </div>

                    @php
                        $etaService = new \App\Services\PickupEtaService();
                        $eta = $etaService->calculateEta($empresa);
                    @endphp
                    <div class="bg-gray-50 rounded-lg p-4 mt-4">
                        <p class="text-sm text-gray-600">
                            <strong>ETA actual:</strong> Si un cliente ordena ahora, el pedido estaria listo aproximadamente:
                        </p>
                        <p class="text-lg font-semibold text-primary-600 mt-1">{{ $etaService->formatEta($eta) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-3">
            <a href="{{ route('admin.empresas.index') }}"
               class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
            </a>
            <button type="submit"
                    class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Guardar Cambios
            </button>
        </div>
    </form>
</div>
@endsection
