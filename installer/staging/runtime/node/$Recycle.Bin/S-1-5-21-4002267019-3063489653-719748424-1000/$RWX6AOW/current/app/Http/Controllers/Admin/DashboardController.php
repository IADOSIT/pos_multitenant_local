<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Orden;
use App\Models\Producto;
use App\Models\Cliente;
use App\Services\DashboardAlertService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Get alerts
        $alertService = new DashboardAlertService((int) $request->session()->get('empresa_id'));
        $alerts = $alertService->getSummary();
        $empresaId = (int) $request->session()->get('empresa_id');

        // Date ranges
        $today = now()->startOfDay();
        $weekStart = now()->startOfWeek();
        $monthStart = now()->startOfMonth();

        // Base query
        $baseQuery = fn() => Orden::where('empresa_id', $empresaId);

        // KPIs
        $ventasHoy = (float) $baseQuery()->whereDate('created_at', today())->sum('total');
        $ventasSemana = (float) $baseQuery()->where('created_at', '>=', $weekStart)->sum('total');
        $ventasMes = (float) $baseQuery()->where('created_at', '>=', $monthStart)->sum('total');

        $ordenesHoy = (int) $baseQuery()->whereDate('created_at', today())->count();
        $ordenesSemana = (int) $baseQuery()->where('created_at', '>=', $weekStart)->count();
        $ordenesMes = (int) $baseQuery()->where('created_at', '>=', $monthStart)->count();

        // Ticket promedio
        $ticketPromedioHoy = $ordenesHoy > 0 ? $ventasHoy / $ordenesHoy : 0;
        $ticketPromedioMes = $ordenesMes > 0 ? $ventasMes / $ordenesMes : 0;

        // Order status counts
        $pendientes = (int) $baseQuery()->whereIn('status', ['pendiente', 'preparando', 'listo'])->count();
        $entregadas = (int) $baseQuery()->where('status', 'entregado')->whereDate('created_at', today())->count();
        $canceladas = (int) $baseQuery()->where('status', 'cancelado')->whereDate('created_at', today())->count();

        // Products and clients
        $productosActivos = (int) Producto::where('empresa_id', $empresaId)->where('activo', true)->count();
        $clientes = (int) Cliente::where('empresa_id', $empresaId)->count();

        // Last 8 orders
        $ultimasOrdenes = Orden::where('empresa_id', $empresaId)
            ->with('cliente')
            ->orderByDesc('id')
            ->limit(8)
            ->get();

        // Sales chart data (last 30 days)
        $chartData = $this->getSalesChartData($empresaId, 30);

        $kpis = [
            'ventas_hoy' => $ventasHoy,
            'ventas_semana' => $ventasSemana,
            'ventas_mes' => $ventasMes,
            'ordenes_hoy' => $ordenesHoy,
            'ordenes_semana' => $ordenesSemana,
            'ordenes_mes' => $ordenesMes,
            'ticket_promedio_hoy' => $ticketPromedioHoy,
            'ticket_promedio_mes' => $ticketPromedioMes,
            'pendientes' => $pendientes,
            'entregadas' => $entregadas,
            'canceladas' => $canceladas,
            'productos_activos' => $productosActivos,
            'clientes' => $clientes,
        ];

        return view('admin.dashboard', compact('kpis', 'ultimasOrdenes', 'chartData', 'alerts'));
    }

    public function chartData(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $days = (int) $request->query('days', 7);
        $days = in_array($days, [7, 14, 30]) ? $days : 7;

        return response()->json($this->getSalesChartData($empresaId, $days));
    }

    private function getSalesChartData(int $empresaId, int $days): array
    {
        $startDate = now()->subDays($days - 1)->startOfDay();

        $sales = Orden::where('empresa_id', $empresaId)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, SUM(total) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $labels = [];
        $totals = [];
        $counts = [];

        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($days - 1 - $i)->format('Y-m-d');
            $labels[] = Carbon::parse($date)->format('d/m');
            $totals[] = isset($sales[$date]) ? (float) $sales[$date]->total : 0;
            $counts[] = isset($sales[$date]) ? (int) $sales[$date]->count : 0;
        }

        return [
            'labels' => $labels,
            'totals' => $totals,
            'counts' => $counts,
        ];
    }
}
