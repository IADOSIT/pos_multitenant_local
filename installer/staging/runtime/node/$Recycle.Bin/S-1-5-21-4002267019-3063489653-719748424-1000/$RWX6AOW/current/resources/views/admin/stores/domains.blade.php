@extends('layouts.admin', ['title' => 'Dominios - ' . $empresa->nombre, 'header' => 'Dominios de ' . $empresa->nombre])

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="mb-4">
        <a href="{{ route('admin.empresas.edit', $empresa) }}" class="text-primary-600 hover:text-primary-700">
            &larr; Volver a editar tienda
        </a>
    </div>

    @if(session('success'))
    <div class="mb-4 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg">
        {{ session('success') }}
    </div>
    @endif

    <!-- Add Domain Form -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Agregar Dominio</h2>
        <form action="{{ route('admin.empresas.domains.store', $empresa) }}" method="POST" class="flex flex-wrap gap-4 items-end">
            @csrf
            <div class="flex-1 min-w-[200px]">
                <label class="block text-sm font-medium text-gray-700 mb-1">Dominio</label>
                <input type="text" name="domain" required
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                       placeholder="tienda.ejemplo.com">
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_primary" value="1" class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm">Primario</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="ssl_enabled" value="1" checked class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm">SSL</span>
            </label>
            <button type="submit" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Agregar
            </button>
        </form>
    </div>

    <!-- Domains List -->
    <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Dominios Configurados</h2>
        </div>

        @if($domains->isEmpty())
        <div class="p-8 text-center text-gray-500">
            No hay dominios configurados. El handle de la tienda es: <strong>{{ $empresa->handle }}</strong>
        </div>
        @else
        <div class="divide-y">
            @foreach($domains as $domain)
            <div class="p-4 flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-medium">{{ $domain->domain }}</span>
                        @if($domain->is_primary)
                        <span class="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">Primario</span>
                        @endif
                        @if(!$domain->is_active)
                        <span class="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">Inactivo</span>
                        @endif
                        @if($domain->ssl_enabled)
                        <span class="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">SSL</span>
                        @endif
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                        {{ $domain->ssl_enabled ? 'https' : 'http' }}://{{ $domain->domain }}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <form action="{{ route('admin.empresas.domains.update', [$empresa, $domain]) }}" method="POST" class="inline">
                        @csrf
                        @method('PUT')
                        <input type="hidden" name="is_primary" value="{{ !$domain->is_primary ? '1' : '0' }}">
                        <input type="hidden" name="is_active" value="{{ $domain->is_active ? '1' : '0' }}">
                        <input type="hidden" name="ssl_enabled" value="{{ $domain->ssl_enabled ? '1' : '0' }}">
                        @if(!$domain->is_primary)
                        <button type="submit" class="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                            Hacer primario
                        </button>
                        @endif
                    </form>
                    <form action="{{ route('admin.empresas.domains.destroy', [$empresa, $domain]) }}" method="POST"
                          onsubmit="return confirm('Eliminar este dominio?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50">
                            Eliminar
                        </button>
                    </form>
                </div>
            </div>
            @endforeach
        </div>
        @endif
    </div>

    <!-- Handle Info -->
    <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="font-medium text-gray-800 mb-2">URL por Handle (siempre disponible)</h3>
        <code class="text-sm bg-white px-3 py-2 rounded border block">
            {{ $empresa->store_url }}
        </code>
    </div>
</div>
@endsection
