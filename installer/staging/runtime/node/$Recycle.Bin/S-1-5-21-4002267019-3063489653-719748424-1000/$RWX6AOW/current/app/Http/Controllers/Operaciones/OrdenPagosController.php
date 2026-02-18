<?php

namespace App\Http\Controllers\Operaciones;

use App\Http\Controllers\Controller;
use App\Models\Orden;
use App\Models\OrdenPago;
use App\Models\CajaTurno;
use App\Models\CajaMovimiento;
use Illuminate\Http\Request;

class OrdenPagosController extends Controller
{
    public function store(Request $request, int $ordenId)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $orden = Orden::where('empresa_id',$empresaId)->findOrFail($ordenId);

        $data = $request->validate([
            'metodo' => 'required|in:cash,card,transfer',
            'monto' => 'required|numeric|min:0.01',
            'referencia' => 'nullable|string|max:120',
        ]);

        $pago = OrdenPago::create([
            'empresa_id' => $empresaId,
            'orden_id' => $orden->id,
            'metodo' => $data['metodo'],
            'monto' => $data['monto'],
            'referencia' => $data['referencia'] ?? null,
            'status' => 'confirmado',
            'actor_usuario_id' => auth()->id(),
        ]);

        // conciliar con caja si hay turno abierto
        $turno = CajaTurno::where('empresa_id',$empresaId)->where('status','abierto')->orderByDesc('id')->first();
        if ($turno) {
            CajaMovimiento::create([
                'empresa_id'=>$empresaId,
                'turno_id'=>$turno->id,
                'tipo'=>'venta',
                'metodo'=>$data['metodo'],
                'monto'=>$data['monto'],
                'orden_id'=>$orden->id,
                'orden_pago_id'=>$pago->id,
                'actor_usuario_id'=>auth()->id(),
                'nota'=>'Pago de orden',
            ]);
        }

        return back()->with('ok','Pago registrado');
    }
}
