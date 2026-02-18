<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CajaSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $empresas = DB::table('empresas')->pluck('id', 'slug')->toArray();
        $users = DB::table('usuarios')->pluck('id', 'email')->toArray();

        $empresaId = $empresas['abastos-mty'] ?? null;
        $cajeroId = $users['cajero@abastosmty.test'] ?? ($users['admin@abastosmty.test'] ?? null);

        if (!$empresaId || !$cajeroId) return;

        // Create a turno for today
        $turnoId = DB::table('caja_turnos')->insertGetId([
            'empresa_id' => $empresaId,
            'usuario_id' => $cajeroId,
            'fondo_inicial' => 1000.00,
            'ventas_efectivo' => 2500.00,
            'ventas_tarjeta' => 1800.00,
            'ventas_transferencia' => 950.00,
            'gastos' => 350.00,
            'entradas' => 0,
            'salidas' => 200.00,
            'fondo_final' => null,
            'diferencia' => null,
            'cerrado_at' => null,
            'created_at' => Carbon::today()->setHour(8),
            'updated_at' => $now,
        ]);

        // Create some movements
        $movimientos = [
            ['tipo' => 'venta', 'monto' => 850.00, 'concepto' => 'Venta orden MTY-001', 'metodo' => 'efectivo'],
            ['tipo' => 'venta', 'monto' => 1200.00, 'concepto' => 'Venta orden MTY-002', 'metodo' => 'tarjeta'],
            ['tipo' => 'venta', 'monto' => 450.00, 'concepto' => 'Venta orden MTY-003', 'metodo' => 'efectivo'],
            ['tipo' => 'gasto', 'monto' => -150.00, 'concepto' => 'Compra de bolsas', 'metodo' => 'efectivo'],
            ['tipo' => 'venta', 'monto' => 600.00, 'concepto' => 'Venta orden MTY-004', 'metodo' => 'transferencia'],
            ['tipo' => 'salida', 'monto' => -200.00, 'concepto' => 'Retiro para banco', 'metodo' => 'efectivo'],
            ['tipo' => 'gasto', 'monto' => -200.00, 'concepto' => 'Pago luz', 'metodo' => 'efectivo'],
            ['tipo' => 'venta', 'monto' => 350.00, 'concepto' => 'Venta orden MTY-005', 'metodo' => 'transferencia'],
            ['tipo' => 'venta', 'monto' => 600.00, 'concepto' => 'Venta orden MTY-006', 'metodo' => 'tarjeta'],
        ];

        foreach ($movimientos as $i => $m) {
            DB::table('caja_movimientos')->insert([
                'turno_id' => $turnoId,
                'tipo' => $m['tipo'],
                'monto' => abs($m['monto']),
                'concepto' => $m['concepto'],
                'metodo_pago' => $m['metodo'],
                'created_at' => Carbon::today()->setHour(8)->addMinutes($i * 30),
                'updated_at' => $now,
            ]);
        }
    }
}
