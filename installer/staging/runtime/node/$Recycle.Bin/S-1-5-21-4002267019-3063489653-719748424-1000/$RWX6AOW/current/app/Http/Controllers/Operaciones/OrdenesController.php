<?php

namespace App\Http\Controllers\Operaciones;

use App\Http\Controllers\Controller;
use App\Models\Orden;
use App\Models\OrdenPago;
use App\Services\WhatsApp\OrderWhatsAppNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrdenesController extends Controller
{
    public function index(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $search = trim((string)$request->get('q',''));
        $status = (string)$request->get('status','');

        $q = Orden::where('empresa_id',$empresaId)->orderByDesc('id');

        if ($search !== '') {
            $s = mb_substr(preg_replace('/[%_]+/u',' ', $search), 0, 80);
            $q->where(function($qq) use ($s){
                $qq->where('folio','ilike',"%{$s}%")
                   ->orWhere('comprador_whatsapp','ilike',"%{$s}%");
            });
        }
        if ($status !== '') $q->where('status',$status);

        $ordenes = $q->paginate(20)->withQueryString();
        $statuses = ['nuevo','confirmado','preparando','listo','en_ruta','entregado','cancelado'];

        return view('ops.ordenes.index', compact('ordenes','search','statuses'));
    }

    public function hoy(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $search = trim((string)$request->get('q',''));

        $q = Orden::where('empresa_id',$empresaId)->whereDate('created_at', now()->toDateString())->orderByDesc('id');
        if ($search !== '') {
            $s = mb_substr(preg_replace('/[%_]+/u',' ', $search), 0, 80);
            $q->where(function($qq) use ($s){
                $qq->where('folio','ilike',"%{$s}%")
                   ->orWhere('comprador_whatsapp','ilike',"%{$s}%");
            });
        }

        $ordenes = $q->get();
        $date = now()->toDateString();

        return view('ops.ordenes.hoy', compact('ordenes','date','search'));
    }

    public function show(Request $request, int $id)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $orden = Orden::where('empresa_id',$empresaId)->with(['items','pagos'])->findOrFail($id);
        $statuses = ['nuevo','confirmado','preparando','listo','en_ruta','entregado','cancelado'];
        return view('ops.ordenes.show', compact('orden','statuses'));
    }

    public function updateStatus(Request $request, int $id, OrderWhatsAppNotifier $wa)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $orden = Orden::where('empresa_id',$empresaId)->findOrFail($id);

        $data = $request->validate([
            'status' => 'required|in:nuevo,confirmado,preparando,listo,en_ruta,entregado,cancelado',
            'nota' => 'nullable|string|max:255',
        ]);

        $from = $orden->status;
        $orden->status = $data['status'];
        $orden->save();

        // historial
        DB::table('orden_status_histories')->insert([
            'empresa_id'=>$empresaId,
            'orden_id'=>$orden->id,
            'from_status'=>$from,
            'to_status'=>$orden->status,
            'actor_usuario_id'=>auth()->id(),
            'nota'=>$data['nota'] ?? null,
            'created_at'=>now(),
            'updated_at'=>now(),
        ]);

        $wa->onStatusChanged($orden, $from);

        return back()->with('ok','Estatus actualizado');
    }

    public function storePago(Request $request, int $id)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $orden = Orden::where('empresa_id', $empresaId)->findOrFail($id);

        $data = $request->validate([
            'metodo' => 'required|in:cash,card,transfer',
            'monto' => 'required|numeric|min:0.01',
            'referencia' => 'nullable|string|max:120',
        ]);

        OrdenPago::create([
            'orden_id' => $orden->id,
            'empresa_id' => $empresaId,
            'metodo' => $data['metodo'],
            'monto' => $data['monto'],
            'referencia' => $data['referencia'],
            'status' => 'paid',
            'actor_usuario_id' => auth()->id(),
        ]);

        return back()->with('ok', 'Pago registrado');
    }
}
