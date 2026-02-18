<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-gray-500">Resumen de operaciones</p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Ventas Hoy -->
        <div class="bg-white rounded-lg shadow p-5 card-hover">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-primary-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Ventas Hoy</p>
                    <p class="text-2xl font-bold text-gray-800">${{ number_format($ventasHoy, 2) }}</p>
                </div>
            </div>
        </div>

        <!-- Ordenes Hoy -->
        <div class="bg-white rounded-lg shadow p-5 card-hover">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-blue-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Ordenes Hoy</p>
                    <p class="text-2xl font-bold text-gray-800">{{ $ordenesHoy }}</p>
                </div>
            </div>
        </div>

        <!-- Ticket Promedio -->
        <div class="bg-white rounded-lg shadow p-5 card-hover">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-yellow-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Ticket Promedio</p>
                    <p class="text-2xl font-bold text-gray-800">${{ number_format($ticketPromedio, 2) }}</p>
                </div>
            </div>
        </div>

        <!-- Productos Activos -->
        <div class="bg-white rounded-lg shadow p-5 card-hover">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-purple-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Productos Activos</p>
                    <p class="text-2xl font-bold text-gray-800">{{ $productosActivos }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-orange-600">Pendientes</p>
                    <p class="text-3xl font-bold text-orange-700">{{ $pendientes }}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-green-600">Entregadas Hoy</p>
                    <p class="text-3xl font-bold text-green-700">{{ $entregadas }}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-red-600">Canceladas Hoy</p>
                    <p class="text-3xl font-bold text-red-700">{{ $canceladas }}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Chart -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow p-5">
            <div class="flex justify-between items-center mb-4">
                <h2 class="font-bold text-gray-800">Ventas</h2>
                <select wire:model.live="dateRange" class="select select-sm select-bordered">
                    <option value="7">7 dias</option>
                    <option value="14">14 dias</option>
                    <option value="30">30 dias</option>
                </select>
            </div>
            <div class="h-64" wire:ignore>
                <canvas id="salesChart"></canvas>
            </div>
        </div>

        <!-- Quick Links -->
        <div class="bg-white rounded-lg shadow p-5">
            <h2 class="font-bold text-gray-800 mb-4">Accesos Rapidos</h2>
            <div class="space-y-2">
                <a href="{{ route('admin.productos.index') }}" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <div class="p-2 bg-primary-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <span class="text-gray-700">Productos</span>
                </a>
                <a href="{{ route('admin.categorias.index') }}" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <div class="p-2 bg-blue-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <span class="text-gray-700">Categorias</span>
                </a>
                <a href="{{ route('ops.ordenes.index') }}" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <div class="p-2 bg-yellow-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <span class="text-gray-700">Ordenes</span>
                </a>
                <a href="{{ route('admin.caja.index') }}" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <div class="p-2 bg-green-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <span class="text-gray-700">Caja</span>
                </a>
            </div>
        </div>
    </div>

    <!-- Recent Orders -->
    <div class="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <div class="p-5 border-b">
            <h2 class="font-bold text-gray-800">Ordenes Recientes</h2>
        </div>
        <div class="overflow-x-auto">
            <table class="table w-full">
                <thead>
                    <tr class="bg-gray-50">
                        <th>Folio</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($ordenesRecientes as $orden)
                        <tr>
                            <td><a href="{{ route('ops.ordenes.show', $orden->id) }}" class="text-primary-600 hover:underline">{{ $orden->folio ?? '#'.$orden->id }}</a></td>
                            <td>{{ $orden->cliente_nombre ?? 'N/A' }}</td>
                            <td class="font-semibold">${{ number_format($orden->total ?? 0, 2) }}</td>
                            <td>
                                @php
                                    $statusColors = [
                                        'pendiente' => 'badge-warning',
                                        'en_proceso' => 'badge-info',
                                        'listo' => 'badge-primary',
                                        'enviado' => 'badge-secondary',
                                        'entregado' => 'badge-success',
                                        'cancelado' => 'badge-error',
                                    ];
                                @endphp
                                <span class="badge {{ $statusColors[$orden->status] ?? 'badge-ghost' }}">{{ $orden->status }}</span>
                            </td>
                            <td class="text-gray-500">{{ $orden->created_at->format('d/m H:i') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center py-4 text-gray-500">No hay ordenes recientes</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>

@script
<script>
    const chartData = @json($chartData);

    const ctx = document.getElementById('salesChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [{
                label: 'Ventas',
                data: chartData.map(d => d.ventas),
                backgroundColor: 'rgba(22, 163, 74, 0.8)',
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    $wire.on('chartDataUpdated', (data) => {
        chart.data.labels = data[0].map(d => d.label);
        chart.data.datasets[0].data = data[0].map(d => d.ventas);
        chart.update();
    });
</script>
@endscript
