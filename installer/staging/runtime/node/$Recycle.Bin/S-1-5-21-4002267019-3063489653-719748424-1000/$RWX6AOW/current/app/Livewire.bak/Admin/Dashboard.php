<?php

namespace App\Livewire\Admin;

use App\Models\Orden;
use App\Models\Producto;
use App\Models\OrdenPago;
use App\Models\CajaTurno;
use Livewire\Component;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Dashboard extends Component
{
    public $dateRange = '7';
    public $chartData = [];

    public function mount()
    {
        $this->loadChartData();
    }

    public function updatedDateRange()
    {
        $this->loadChartData();
    }

    private function loadChartData()
    {
        $empresaId = session('empresa_id');
        $days = (int) $this->dateRange;

        $data = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $data[$date] = [
                'label' => Carbon::now()->subDays($i)->format('d/m'),
                'ventas' => 0,
                'ordenes' => 0,
            ];
        }

        // Get sales data
        $sales = Orden::where('empresa_id', $empresaId)
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->whereNotNull('total')
            ->selectRaw('DATE(created_at) as date, SUM(total) as ventas, COUNT(*) as ordenes')
            ->groupBy('date')
            ->get();

        foreach ($sales as $sale) {
            if (isset($data[$sale->date])) {
                $data[$sale->date]['ventas'] = (float) $sale->ventas;
                $data[$sale->date]['ordenes'] = (int) $sale->ordenes;
            }
        }

        $this->chartData = array_values($data);
    }

    public function render()
    {
        $empresaId = session('empresa_id');
        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();
        $monthStart = Carbon::now()->startOfMonth();

        // KPIs
        $ventasHoy = Orden::where('empresa_id', $empresaId)
            ->whereDate('created_at', $today)
            ->sum('total') ?? 0;

        $ventasSemana = Orden::where('empresa_id', $empresaId)
            ->where('created_at', '>=', $weekStart)
            ->sum('total') ?? 0;

        $ventasMes = Orden::where('empresa_id', $empresaId)
            ->where('created_at', '>=', $monthStart)
            ->sum('total') ?? 0;

        $ordenesHoy = Orden::where('empresa_id', $empresaId)
            ->whereDate('created_at', $today)
            ->count();

        $ordenesSemana = Orden::where('empresa_id', $empresaId)
            ->where('created_at', '>=', $weekStart)
            ->count();

        $ordenesMes = Orden::where('empresa_id', $empresaId)
            ->where('created_at', '>=', $monthStart)
            ->count();

        $ticketPromedio = $ordenesHoy > 0 ? $ventasHoy / $ordenesHoy : 0;

        $pendientes = Orden::where('empresa_id', $empresaId)
            ->whereIn('status', ['pendiente', 'en_proceso'])
            ->count();

        $entregadas = Orden::where('empresa_id', $empresaId)
            ->where('status', 'entregado')
            ->whereDate('created_at', $today)
            ->count();

        $canceladas = Orden::where('empresa_id', $empresaId)
            ->where('status', 'cancelado')
            ->whereDate('created_at', $today)
            ->count();

        $productosActivos = Producto::where('empresa_id', $empresaId)
            ->where('activo', true)
            ->count();

        // Recent orders
        $ordenesRecientes = Orden::where('empresa_id', $empresaId)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return view('livewire.admin.dashboard', [
            'ventasHoy' => $ventasHoy,
            'ventasSemana' => $ventasSemana,
            'ventasMes' => $ventasMes,
            'ordenesHoy' => $ordenesHoy,
            'ordenesSemana' => $ordenesSemana,
            'ordenesMes' => $ordenesMes,
            'ticketPromedio' => $ticketPromedio,
            'pendientes' => $pendientes,
            'entregadas' => $entregadas,
            'canceladas' => $canceladas,
            'productosActivos' => $productosActivos,
            'ordenesRecientes' => $ordenesRecientes,
        ]);
    }
}
