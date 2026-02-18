<div class="p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">Ordenes</h1>
            <p class="text-gray-500">Gestiona las ordenes del dia</p>
        </div>
    </div>

    <!-- Status Summary -->
    <div class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        @php
            $statuses = [
                'pendiente' => ['label' => 'Pendiente', 'color' => 'bg-yellow-100 text-yellow-700 border-yellow-300'],
                'en_proceso' => ['label' => 'En Proceso', 'color' => 'bg-blue-100 text-blue-700 border-blue-300'],
                'listo' => ['label' => 'Listo', 'color' => 'bg-purple-100 text-purple-700 border-purple-300'],
                'enviado' => ['label' => 'Enviado', 'color' => 'bg-indigo-100 text-indigo-700 border-indigo-300'],
                'entregado' => ['label' => 'Entregado', 'color' => 'bg-green-100 text-green-700 border-green-300'],
                'cancelado' => ['label' => 'Cancelado', 'color' => 'bg-red-100 text-red-700 border-red-300'],
            ];
        @endphp
        @foreach($statuses as $key => $status)
            <button wire:click="$set('filterStatus', '{{ $filterStatus === $key ? '' : $key }}')"
                class="p-3 rounded-lg border-2 {{ $filterStatus === $key ? 'ring-2 ring-offset-2 ring-primary-500' : '' }} {{ $status['color'] }}">
                <div class="text-2xl font-bold">{{ $statusCounts[$key] ?? 0 }}</div>
                <div class="text-sm">{{ $status['label'] }}</div>
            </button>
        @endforeach
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1">
                <input type="text" wire:model.live.debounce.300ms="search"
                    placeholder="Buscar por folio, cliente o telefono..."
                    class="input input-bordered w-full" />
            </div>
            <div class="flex gap-2 flex-wrap">
                <select wire:model.live="filterDate" class="select select-bordered">
                    <option value="hoy">Hoy</option>
                    <option value="ayer">Ayer</option>
                    <option value="semana">Esta Semana</option>
                    <option value="mes">Este Mes</option>
                    <option value="todas">Todas</option>
                    <option value="rango">Rango</option>
                </select>
                @if($filterDate === 'rango')
                    <input type="date" wire:model.live="dateFrom" class="input input-bordered" />
                    <input type="date" wire:model.live="dateTo" class="input input-bordered" />
                @endif
            </div>
        </div>
    </div>

    <!-- Orders Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
            <table class="table w-full">
                <thead>
                    <tr class="bg-gray-50">
                        <th>Folio</th>
                        <th>Cliente</th>
                        <th>Telefono</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Fecha</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($ordenes as $orden)
                        <tr wire:key="orden-{{ $orden->id }}">
                            <td>
                                <a href="{{ route('ops.ordenes.show', $orden->id) }}"
                                   class="font-medium text-primary-600 hover:underline">
                                    {{ $orden->folio ?? '#'.$orden->id }}
                                </a>
                            </td>
                            <td>{{ $orden->cliente_nombre ?? 'N/A' }}</td>
                            <td>{{ $orden->cliente_telefono ?? '-' }}</td>
                            <td class="font-semibold">${{ number_format($orden->total ?? 0, 2) }}</td>
                            <td>
                                <div class="dropdown dropdown-end">
                                    <label tabindex="0" class="cursor-pointer">
                                        @php
                                            $badgeClass = match($orden->status) {
                                                'pendiente' => 'badge-warning',
                                                'en_proceso' => 'badge-info',
                                                'listo' => 'badge-primary',
                                                'enviado' => 'badge-secondary',
                                                'entregado' => 'badge-success',
                                                'cancelado' => 'badge-error',
                                                default => 'badge-ghost'
                                            };
                                        @endphp
                                        <span class="badge {{ $badgeClass }}">{{ $orden->status }}</span>
                                    </label>
                                    <ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40">
                                        @foreach(['pendiente', 'en_proceso', 'listo', 'enviado', 'entregado', 'cancelado'] as $status)
                                            <li>
                                                <button wire:click="updateStatus({{ $orden->id }}, '{{ $status }}')"
                                                    class="{{ $orden->status === $status ? 'active' : '' }}">
                                                    {{ ucfirst(str_replace('_', ' ', $status)) }}
                                                </button>
                                            </li>
                                        @endforeach
                                    </ul>
                                </div>
                            </td>
                            <td class="text-gray-500 text-sm">
                                {{ $orden->created_at->format('d/m/Y H:i') }}
                            </td>
                            <td class="text-right">
                                <a href="{{ route('ops.ordenes.show', $orden->id) }}" class="btn btn-sm btn-ghost">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="text-center py-8 text-gray-500">
                                No se encontraron ordenes
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($ordenes->hasPages())
            <div class="px-4 py-3 border-t">
                {{ $ordenes->links() }}
            </div>
        @endif
    </div>
</div>
