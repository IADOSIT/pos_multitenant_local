<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CajaTurno;
use App\Models\CajaMovimiento;
use Illuminate\Http\Request;

class CajaController extends Controller
{
    public function index(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        // Buscar turno abierto (status = 'abierto' o cerrado_at es null)
        $turno = CajaTurno::where('empresa_id', $empresaId)
            ->where(function($q) {
                $q->where('status', 'abierto')
                  ->orWhereNull('cerrado_at');
            })
            ->whereNull('cerrado_at')
            ->orderByDesc('id')
            ->first();

        $movs = CajaMovimiento::where('empresa_id', $empresaId)
            ->orderByDesc('id')
            ->limit(25)
            ->get();

        return view('admin.caja.index', compact('turno', 'movs'));
    }

    public function abrir(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $userId = auth()->id();

        // Verificar si ya hay un turno abierto
        $exists = CajaTurno::where('empresa_id', $empresaId)
            ->whereNull('cerrado_at')
            ->exists();

        if ($exists) {
            return back()->with('error', 'Ya hay un turno abierto');
        }

        // Crear nuevo turno
        $turno = CajaTurno::create([
            'empresa_id' => $empresaId,
            'usuario_id' => $userId,
            'actor_usuario_id' => $userId,
            'saldo_inicial' => 0,
            'status' => 'abierto',
            'abierto_at' => now(),
            'meta' => [],
        ]);

        return redirect()->route('admin.caja.turno', $turno->id)->with('ok', 'Turno abierto correctamente');
    }

    public function cerrar(Request $request, int $turnoId)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $turno = CajaTurno::where('empresa_id', $empresaId)->findOrFail($turnoId);

        // Calcular saldo final
        $totalMovimientos = CajaMovimiento::where('turno_id', $turno->id)->sum('monto');

        $turno->update([
            'status' => 'cerrado',
            'cerrado_at' => now(),
            'saldo_final_declarado' => $turno->saldo_inicial + $totalMovimientos,
        ]);

        return redirect()->route('admin.caja.index')->with('ok', 'Turno cerrado correctamente');
    }

    public function turno(Request $request, int $turnoId)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $turno = CajaTurno::where('empresa_id', $empresaId)->findOrFail($turnoId);

        $movs = CajaMovimiento::where('turno_id', $turno->id)
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        // Calcular breakdown por metodo
        $breakdown = [
            'efectivo' => (float) CajaMovimiento::where('turno_id', $turno->id)
                ->whereIn('metodo', ['cash', 'efectivo'])
                ->sum('monto'),
            'tarjeta' => (float) CajaMovimiento::where('turno_id', $turno->id)
                ->whereIn('metodo', ['card', 'tarjeta'])
                ->sum('monto'),
            'transferencia' => (float) CajaMovimiento::where('turno_id', $turno->id)
                ->whereIn('metodo', ['transfer', 'transferencia'])
                ->sum('monto'),
        ];

        $total = array_sum($breakdown);

        return view('admin.caja.turno', compact('turno', 'movs', 'breakdown', 'total'));
    }

    public function movimiento(Request $request, int $turnoId)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $turno = CajaTurno::where('empresa_id', $empresaId)->findOrFail($turnoId);

        // Verificar que el turno este abierto
        if ($turno->cerrado_at) {
            return back()->with('error', 'No se pueden agregar movimientos a un turno cerrado');
        }

        $data = $request->validate([
            'tipo' => 'required|in:venta,ingreso,egreso,gasto,entrada,salida',
            'metodo' => 'required|in:cash,card,transfer,efectivo,tarjeta,transferencia',
            'monto' => 'required|numeric',
            'nota' => 'nullable|string|max:255',
        ]);

        // Normalizar metodo
        $metodo = match($data['metodo']) {
            'cash', 'efectivo' => 'efectivo',
            'card', 'tarjeta' => 'tarjeta',
            'transfer', 'transferencia' => 'transferencia',
            default => $data['metodo']
        };

        // Ajustar monto segun tipo (egresos/gastos/salidas son negativos)
        $monto = abs($data['monto']);
        if (in_array($data['tipo'], ['egreso', 'gasto', 'salida'])) {
            $monto = -$monto;
        }

        CajaMovimiento::create([
            'empresa_id' => $empresaId,
            'turno_id' => $turno->id,
            'tipo' => $data['tipo'],
            'metodo' => $metodo,
            'monto' => $monto,
            'nota' => $data['nota'] ?? null,
            'actor_usuario_id' => auth()->id(),
        ]);

        return back()->with('ok', 'Movimiento registrado');
    }

    public function history(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $query = CajaMovimiento::where('empresa_id', $empresaId)->orderByDesc('id');

        if ($from = $request->get('from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->get('to')) {
            $query->whereDate('created_at', '<=', $to);
        }
        if ($metodo = $request->get('metodo')) {
            $query->where('metodo', $metodo);
        }

        $movs = $query->paginate(30)->withQueryString();

        return view('admin.caja.history', compact('movs'));
    }
}
