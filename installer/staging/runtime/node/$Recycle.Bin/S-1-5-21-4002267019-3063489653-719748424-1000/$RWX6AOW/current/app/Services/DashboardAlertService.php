<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardAlertService
{
    protected int $empresaId;
    protected array $thresholds;

    public function __construct(?int $empresaId = null)
    {
        $this->empresaId = $empresaId ?? session('empresa_id', 0);
        $this->thresholds = [
            'inventory_low' => 10,
            'orders_pending_days' => 3,
            'delivery_delayed_days' => 2,
            'payments_pending_days' => 7,
        ];
    }

    /**
     * Get all alerts for dashboard
     */
    public function getAlerts(): array
    {
        $cacheKey = "dashboard_alerts_{$this->empresaId}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () {
            try {
                return [
                    'inventory_low' => $this->getInventoryLowAlert(),
                    'orders_pending' => $this->getOrdersPendingAlert(),
                    'delivery_delayed' => $this->getDeliveryDelayedAlert(),
                    'payments_pending' => $this->getPaymentsPendingAlert(),
                ];
            } catch (\Exception $e) {
                \Log::warning('Dashboard alerts error: ' . $e->getMessage());
                return [];
            }
        });
    }

    /**
     * Get summary counts for quick display
     */
    public function getSummary(): array
    {
        $alerts = $this->getAlerts();

        return [
            'total_alerts' => collect($alerts)->sum('count'),
            'critical' => collect($alerts)->where('level', 'critical')->sum('count'),
            'warning' => collect($alerts)->where('level', 'warning')->sum('count'),
            'info' => collect($alerts)->where('level', 'info')->sum('count'),
            'alerts' => $alerts,
        ];
    }

    /**
     * Products with low inventory
     */
    protected function getInventoryLowAlert(): array
    {
        try {
            $threshold = $this->thresholds['inventory_low'];

            // Simple count of products - inventory tracking may not be implemented yet
            $count = DB::table('productos')
                ->where('empresa_id', $this->empresaId)
                ->where('activo', true)
                ->count();

            // For now, just show product count as info
            return [
                'type' => 'inventory_low',
                'title' => 'Productos activos',
                'count' => $count,
                'level' => 'info',
                'icon' => 'package',
                'route' => 'admin.productos.index',
                'message' => "{$count} productos en catalogo",
            ];
        } catch (\Exception $e) {
            return [
                'type' => 'inventory_low',
                'title' => 'Inventario',
                'count' => 0,
                'level' => 'info',
                'icon' => 'package',
                'route' => 'admin.productos.index',
                'message' => 'Sin datos',
            ];
        }
    }

    /**
     * Orders pending for too long
     */
    protected function getOrdersPendingAlert(): array
    {
        $days = $this->thresholds['orders_pending_days'];

        $count = DB::table('ordenes')
            ->where('empresa_id', $this->empresaId)
            ->whereIn('status', ['pending', 'pendiente', 'preparando'])
            ->where('created_at', '<', now()->subDays($days))
            ->count();

        return [
            'type' => 'orders_pending',
            'title' => 'Ordenes pendientes',
            'count' => $count,
            'level' => $count > 3 ? 'critical' : ($count > 0 ? 'warning' : 'info'),
            'icon' => 'shopping-cart',
            'route' => 'ops.ordenes.hoy',
            'message' => $count > 0 ? "{$count} ordenes sin atender (+{$days} dias)" : 'Sin ordenes atrasadas',
        ];
    }

    /**
     * Deliveries that are delayed
     */
    protected function getDeliveryDelayedAlert(): array
    {
        $days = $this->thresholds['delivery_delayed_days'];

        $count = DB::table('ordenes')
            ->where('empresa_id', $this->empresaId)
            ->whereIn('status', ['enviado', 'shipped'])
            ->where('updated_at', '<', now()->subDays($days))
            ->count();

        return [
            'type' => 'delivery_delayed',
            'title' => 'Entregas retrasadas',
            'count' => $count,
            'level' => $count > 2 ? 'critical' : ($count > 0 ? 'warning' : 'info'),
            'icon' => 'truck',
            'route' => 'ops.ordenes.hoy',
            'message' => $count > 0 ? "{$count} envios sin confirmar entrega" : 'Entregas al dia',
        ];
    }

    /**
     * Payments pending (orders not yet delivered/completed)
     */
    protected function getPaymentsPendingAlert(): array
    {
        $days = $this->thresholds['payments_pending_days'];

        // Orders that are not cancelled/completed and older than X days
        $count = DB::table('ordenes')
            ->where('empresa_id', $this->empresaId)
            ->whereNotIn('status', ['cancelado', 'cancelled', 'entregado', 'delivered', 'completed'])
            ->where('created_at', '<', now()->subDays($days))
            ->count();

        $total = DB::table('ordenes')
            ->where('empresa_id', $this->empresaId)
            ->whereNotIn('status', ['cancelado', 'cancelled', 'entregado', 'delivered', 'completed'])
            ->where('created_at', '<', now()->subDays($days))
            ->sum('total');

        return [
            'type' => 'payments_pending',
            'title' => 'Pagos pendientes',
            'count' => $count,
            'total' => $total,
            'level' => $count > 5 ? 'critical' : ($count > 0 ? 'warning' : 'info'),
            'icon' => 'dollar-sign',
            'route' => 'ops.ordenes.hoy',
            'message' => $count > 0 ? "{$count} ordenes sin completar (\${$total})" : 'Sin pagos pendientes',
        ];
    }

    /**
     * Clear cached alerts
     */
    public function clearCache(): void
    {
        Cache::forget("dashboard_alerts_{$this->empresaId}");
    }
}
