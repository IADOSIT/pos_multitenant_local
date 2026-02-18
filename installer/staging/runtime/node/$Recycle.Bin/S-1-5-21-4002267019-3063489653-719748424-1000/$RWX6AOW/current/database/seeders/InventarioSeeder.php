<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventarioSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $productos = DB::table('productos')->get();

        foreach ($productos as $producto) {
            $stockInicial = rand(50, 200);

            // Create initial inventory record
            DB::table('inventarios')->updateOrInsert(
                ['producto_id' => $producto->id],
                [
                    'empresa_id' => $producto->empresa_id,
                    'stock' => $stockInicial,
                    'stock_minimo' => 10,
                    'stock_maximo' => 500,
                    'ubicacion' => 'Bodega Principal',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            // Create initial movement (entrada)
            DB::table('inventario_movimientos')->insert([
                'producto_id' => $producto->id,
                'tipo' => 'entrada',
                'cantidad' => $stockInicial,
                'stock_anterior' => 0,
                'stock_nuevo' => $stockInicial,
                'concepto' => 'Inventario inicial',
                'referencia' => 'INIT-' . $producto->id,
                'usuario_id' => null,
                'created_at' => Carbon::now()->subDays(7),
                'updated_at' => $now,
            ]);

            // Simulate some sales (salidas)
            $ventaQty = rand(5, 20);
            if ($stockInicial > $ventaQty) {
                DB::table('inventario_movimientos')->insert([
                    'producto_id' => $producto->id,
                    'tipo' => 'salida',
                    'cantidad' => $ventaQty,
                    'stock_anterior' => $stockInicial,
                    'stock_nuevo' => $stockInicial - $ventaQty,
                    'concepto' => 'Venta',
                    'referencia' => 'VENTA-DEMO',
                    'usuario_id' => null,
                    'created_at' => Carbon::now()->subDays(2),
                    'updated_at' => $now,
                ]);

                // Update stock
                DB::table('inventarios')
                    ->where('producto_id', $producto->id)
                    ->update(['stock' => $stockInicial - $ventaQty]);
            }
        }
    }
}
