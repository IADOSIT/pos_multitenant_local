<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrdenPago;
use App\Models\Orden;
use App\Services\MercadoPagoService;
use Illuminate\Http\Request;

class PagosController extends Controller
{
    public function index(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $query = OrdenPago::where('empresa_id', $empresaId)
            ->with(['orden'])
            ->orderByDesc('id');

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($from = $request->get('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->get('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $pagos = $query->paginate(30)->withQueryString();

        $stats = [
            'total' => OrdenPago::where('empresa_id', $empresaId)->count(),
            'paid' => OrdenPago::where('empresa_id', $empresaId)->where('status', 'paid')->count(),
            'pending' => OrdenPago::where('empresa_id', $empresaId)->where('status', 'pending')->count(),
            'failed' => OrdenPago::where('empresa_id', $empresaId)->where('status', 'failed')->count(),
        ];

        return view('admin.pagos.index', compact('pagos', 'stats'));
    }

    public function show(Request $request, int $id)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $pago = OrdenPago::where('empresa_id', $empresaId)
            ->with(['orden', 'orden.items', 'orden.cliente'])
            ->findOrFail($id);

        return view('admin.pagos.show', compact('pago'));
    }

    public function refresh(Request $request, int $id)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $pago = OrdenPago::where('empresa_id', $empresaId)->findOrFail($id);

        if ($pago->provider !== 'mercadopago' || !$pago->provider_id) {
            return back()->with('error', 'Este pago no tiene referencia de MercadoPago');
        }

        try {
            $mpService = new MercadoPagoService($empresaId);
            $result = $mpService->getPaymentStatus($pago->provider_id);

            if ($result) {
                $pago->update([
                    'status' => $result['status'],
                    'provider_response' => $result,
                ]);

                return back()->with('ok', 'Estado actualizado: ' . $pago->getStatusLabel());
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Error al consultar MercadoPago: ' . $e->getMessage());
        }

        return back()->with('error', 'No se pudo obtener el estado del pago');
    }
}
