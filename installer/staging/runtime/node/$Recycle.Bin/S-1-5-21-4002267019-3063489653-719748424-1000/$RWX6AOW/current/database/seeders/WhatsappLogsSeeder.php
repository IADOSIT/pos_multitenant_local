<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WhatsappLogsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $empresas = DB::table('empresas')->pluck('id', 'slug')->toArray();
        $ordenes = DB::table('ordenes')->get();

        foreach ($ordenes as $orden) {
            if (!$orden->cliente_telefono) continue;

            // Create a couple of logs per order
            $logs = [
                [
                    'tipo' => 'confirmacion',
                    'mensaje' => "Hola {$orden->cliente_nombre}, tu orden {$orden->folio} ha sido recibida. Total: \${$orden->total}",
                    'status' => 'enviado',
                    'created_at' => Carbon::parse($orden->created_at)->addMinutes(1),
                ],
            ];

            if ($orden->status === 'enviado' || $orden->status === 'entregado') {
                $logs[] = [
                    'tipo' => 'actualizacion',
                    'mensaje' => "Tu orden {$orden->folio} esta en camino. Llegara en aproximadamente 30 minutos.",
                    'status' => 'enviado',
                    'created_at' => Carbon::parse($orden->created_at)->addHours(1),
                ];
            }

            if ($orden->status === 'entregado') {
                $logs[] = [
                    'tipo' => 'completado',
                    'mensaje' => "Tu orden {$orden->folio} ha sido entregada. Gracias por tu compra!",
                    'status' => 'enviado',
                    'created_at' => Carbon::parse($orden->created_at)->addHours(2),
                ];
            }

            foreach ($logs as $log) {
                DB::table('whatsapp_logs')->insert([
                    'empresa_id' => $orden->empresa_id,
                    'orden_id' => $orden->id,
                    'telefono' => $orden->cliente_telefono,
                    'tipo' => $log['tipo'],
                    'mensaje' => $log['mensaje'],
                    'status' => $log['status'],
                    'error' => null,
                    'created_at' => $log['created_at'],
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
