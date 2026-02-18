@extends('layouts.admin', ['title'=>'Clientes','header'=>'Clientes'])

@section('content')
<div class="flex flex-wrap items-center justify-between gap-4 mb-4">
    <form class="flex flex-wrap gap-2" method="GET">
        @if(!empty($empresas) && isset($empresaId))
            <select name="empresa_id" onchange="this.form.submit()" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">Todas las empresas</option>
                @foreach($empresas as $emp)
                    <option value="{{ $emp->id }}" {{ $emp->id == request('empresa_id') ? 'selected' : '' }}>{{ $emp->nombre }}</option>
                @endforeach
            </select>
        @endif
        <input name="q" value="{{ $search }}" class="border rounded-lg px-4 py-2 w-72 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Nombre / WhatsApp / Email">
        <button class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Buscar</button>
    </form>
    <a href="{{ route('admin.clientes.create') }}" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        Nuevo Cliente
    </a>
</div>

<div class="bg-white border rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
            <tr>
                <th class="text-left p-4 font-semibold text-gray-700">Cliente</th>
                @if(!empty($empresas))
                    <th class="text-left p-4 font-semibold text-gray-700">Empresa</th>
                @endif
                <th class="text-left p-4 font-semibold text-gray-700">WhatsApp</th>
                <th class="text-left p-4 font-semibold text-gray-700">Email</th>
                <th class="text-center p-4 font-semibold text-gray-700">Enviar estatus</th>
                <th class="p-4"></th>
            </tr>
        </thead>
        <tbody class="divide-y">
            @forelse($clientes as $c)
                <tr class="hover:bg-gray-50">
                    <td class="p-4">
                        <div class="font-medium text-gray-900">{{ $c->nombre }}</div>
                        @if($c->direccion)
                            <div class="text-xs text-gray-500 truncate max-w-xs">{{ $c->direccion }}</div>
                        @endif
                    </td>
                    @if(!empty($empresas))
                        <td class="p-4 text-xs">
                            <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ $c->empresa?->nombre ?? 'ID:'.$c->empresa_id }}</span>
                        </td>
                    @endif
                    <td class="p-4">
                        @if($c->whatsapp)
                            <a href="https://wa.me/52{{ preg_replace('/[^0-9]/', '', $c->whatsapp) }}" target="_blank" class="text-green-600 hover:text-green-700 flex items-center gap-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                {{ $c->whatsapp }}
                            </a>
                        @else
                            <span class="text-gray-400">—</span>
                        @endif
                    </td>
                    <td class="p-4">
                        @if($c->email)
                            <a href="mailto:{{ $c->email }}" class="text-blue-600 hover:underline">{{ $c->email }}</a>
                        @else
                            <span class="text-gray-400">—</span>
                        @endif
                    </td>
                    <td class="p-4 text-center">
                        <form method="POST" action="{{ route('admin.clientes.toggle', $c->id) }}">
                            @csrf
                            <button class="px-3 py-1 rounded-full text-xs font-medium {{ $c->enviar_estatus ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600' }}">
                                {{ $c->enviar_estatus ? 'Si' : 'No' }}
                            </button>
                        </form>
                    </td>
                    <td class="p-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <a class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" href="{{ route('admin.clientes.show', $c->id) }}" title="Ver">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                            </a>
                            <a class="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg" href="{{ route('admin.clientes.edit', $c->id) }}" title="Editar">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </a>
                        </div>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="{{ !empty($empresas) ? 6 : 5 }}" class="p-8 text-center text-gray-500">
                        <div class="flex flex-col items-center gap-2">
                            <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                            </svg>
                            <p>No hay clientes registrados</p>
                            <a href="{{ route('admin.clientes.create') }}" class="text-primary-600 hover:underline">Agregar el primer cliente</a>
                        </div>
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-4">{{ $clientes->links() }}</div>
@endsection
