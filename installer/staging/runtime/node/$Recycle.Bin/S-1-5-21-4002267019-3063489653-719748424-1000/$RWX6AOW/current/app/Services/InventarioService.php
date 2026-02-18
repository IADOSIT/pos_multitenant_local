<?php

namespace App\Services;

use App\Models\InventarioMovimiento;
use Illuminate\Support\Facades\DB;

class InventarioService
{
    public function stock(int $empresaId, int $productoId): int
    {
        if (!DB::getSchemaBuilder()->hasTable('inventario_movimientos')) return 0;
        $sum = (int) InventarioMovimiento::where('empresa_id',$empresaId)->where('producto_id',$productoId)->sum('cantidad');
        return $sum;
    }

    public function hasStock(int $empresaId, int $productoId, int $qty): bool
    {
        // Si no hay movimientos, asumimos stock ilimitado (modo demo)
        $hasAny = DB::table('inventario_movimientos')->where('empresa_id',$empresaId)->where('producto_id',$productoId)->exists();
        if (!$hasAny) return true;
        return $this->stock($empresaId,$productoId) >= $qty;
    }

    public function venta(int $empresaId, int $productoId, int $qty, int $ordenId): void
    {
        if (!DB::getSchemaBuilder()->hasTable('inventario_movimientos')) return;

        InventarioMovimiento::create([
            'empresa_id'=>$empresaId,
            'producto_id'=>$productoId,
            'tipo'=>'venta',
            'cantidad'=> -abs($qty),
            'ref_tipo'=>'orden',
            'ref_id'=>$ordenId,
            'actor_usuario_id'=>null,
            'meta'=>[],
        ]);
    }

    public function ajuste(int $empresaId, int $productoId, int $cantidad, string $tipo, ?string $nota, ?int $actorUserId): void
    {
        if (!DB::getSchemaBuilder()->hasTable('inventario_movimientos')) return;

        InventarioMovimiento::create([
            'empresa_id'=>$empresaId,
            'producto_id'=>$productoId,
            'tipo'=>$tipo,
            'cantidad'=>$cantidad,
            'ref_tipo'=>'manual',
            'ref_id'=>null,
            'actor_usuario_id'=>$actorUserId,
            'meta'=>['nota'=>$nota],
        ]);
    }
}
