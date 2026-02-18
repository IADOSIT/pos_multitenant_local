<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrdenesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $empresas = DB::table('empresas')->pluck('id', 'slug')->toArray();
        $productos = DB::table('productos')
            ->get()
            ->groupBy('empresa_id')
            ->map(fn($items) => $items->toArray())
            ->toArray();

        $ordenes = [
            // Abastos MTY
            [
                'empresa' => 'abastos-mty',
                'folio' => 'MTY-001',
                'cliente_nombre' => 'Roberto Martinez',
                'cliente_telefono' => '8311234567',
                'cliente_email' => 'roberto@email.com',
                'direccion_calle' => 'Av. Revolucion 1500',
                'direccion_colonia' => 'Centro',
                'direccion_ciudad' => 'Monterrey',
                'status' => 'entregado',
                'metodo_pago' => 'efectivo',
                'items_count' => 3,
                'created_at' => Carbon::now()->subDays(2),
            ],
            [
                'empresa' => 'abastos-mty',
                'folio' => 'MTY-002',
                'cliente_nombre' => 'Laura Gonzalez',
                'cliente_telefono' => '8319876543',
                'cliente_email' => 'laura@email.com',
                'direccion_calle' => 'Calle Madero 200',
                'direccion_colonia' => 'Mitras',
                'direccion_ciudad' => 'Monterrey',
                'status' => 'en_proceso',
                'metodo_pago' => 'transferencia',
                'items_count' => 5,
                'created_at' => Carbon::now()->subHours(4),
            ],
            [
                'empresa' => 'abastos-mty',
                'folio' => 'MTY-003',
                'cliente_nombre' => 'Carlos Ramirez',
                'cliente_telefono' => '8315551234',
                'cliente_email' => 'carlos@email.com',
                'direccion_calle' => 'Blvd. Diaz Ordaz 500',
                'direccion_colonia' => 'Del Valle',
                'direccion_ciudad' => 'San Pedro',
                'status' => 'pendiente',
                'metodo_pago' => 'efectivo',
                'items_count' => 2,
                'created_at' => Carbon::now()->subHours(1),
            ],
            // FruVer Norte
            [
                'empresa' => 'fruver-norte',
                'folio' => 'FV-001',
                'cliente_nombre' => 'Ana Lopez',
                'cliente_telefono' => '8314443322',
                'cliente_email' => 'ana@email.com',
                'direccion_calle' => 'Av. Vasconcelos 800',
                'direccion_colonia' => 'Santa Engracia',
                'direccion_ciudad' => 'San Pedro',
                'status' => 'listo',
                'metodo_pago' => 'tarjeta',
                'items_count' => 4,
                'created_at' => Carbon::now()->subHours(3),
            ],
            [
                'empresa' => 'fruver-norte',
                'folio' => 'FV-002',
                'cliente_nombre' => 'Pedro Sanchez',
                'cliente_telefono' => '8316667788',
                'cliente_email' => 'pedro@email.com',
                'direccion_calle' => 'Calle Roma 150',
                'direccion_colonia' => 'Roma',
                'direccion_ciudad' => 'Monterrey',
                'status' => 'enviado',
                'metodo_pago' => 'efectivo',
                'items_count' => 3,
                'created_at' => Carbon::now()->subHours(2),
            ],
        ];

        foreach ($ordenes as $o) {
            $empresaId = $empresas[$o['empresa']] ?? null;
            if (!$empresaId) continue;

            $empresaProductos = $productos[$empresaId] ?? [];
            if (empty($empresaProductos)) continue;

            // Random products
            shuffle($empresaProductos);
            $selectedProducts = array_slice($empresaProductos, 0, $o['items_count']);

            $subtotal = 0;
            $items = [];
            foreach ($selectedProducts as $prod) {
                $qty = rand(1, 3);
                $items[] = [
                    'producto_id' => $prod->id,
                    'nombre' => $prod->nombre,
                    'precio' => $prod->precio,
                    'cantidad' => $qty,
                    'subtotal' => $prod->precio * $qty,
                ];
                $subtotal += $prod->precio * $qty;
            }

            $envio = $subtotal >= 500 ? 0 : 50;
            $total = $subtotal + $envio;

            // Create orden
            $ordenId = DB::table('ordenes')->insertGetId([
                'empresa_id' => $empresaId,
                'folio' => $o['folio'],
                'cliente_nombre' => $o['cliente_nombre'],
                'cliente_telefono' => $o['cliente_telefono'],
                'cliente_email' => $o['cliente_email'],
                'direccion_calle' => $o['direccion_calle'],
                'direccion_colonia' => $o['direccion_colonia'],
                'direccion_ciudad' => $o['direccion_ciudad'],
                'status' => $o['status'],
                'metodo_pago' => $o['metodo_pago'],
                'subtotal' => $subtotal,
                'envio' => $envio,
                'total' => $total,
                'notas' => null,
                'created_at' => $o['created_at'],
                'updated_at' => $now,
            ]);

            // Create orden items
            foreach ($items as $item) {
                DB::table('orden_items')->insert([
                    'orden_id' => $ordenId,
                    'producto_id' => $item['producto_id'],
                    'nombre' => $item['nombre'],
                    'precio' => $item['precio'],
                    'cantidad' => $item['cantidad'],
                    'subtotal' => $item['subtotal'],
                    'created_at' => $o['created_at'],
                    'updated_at' => $now,
                ]);
            }

            // Create payment for entregado orders
            if ($o['status'] === 'entregado') {
                DB::table('orden_pagos')->insert([
                    'orden_id' => $ordenId,
                    'monto' => $total,
                    'metodo' => $o['metodo_pago'],
                    'referencia' => 'DEMO-' . rand(1000, 9999),
                    'created_at' => $o['created_at']->addMinutes(30),
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
