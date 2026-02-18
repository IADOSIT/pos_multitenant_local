<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // categorias.orden
        if (Schema::hasTable('categorias')) {
            Schema::table('categorias', function (Blueprint $table) {
                if (!Schema::hasColumn('categorias', 'orden')) {
                    $table->integer('orden')->default(0)->index();
                }
            });
        }

        // productos: sku, descripcion, meta
        if (Schema::hasTable('productos')) {
            Schema::table('productos', function (Blueprint $table) {
                if (!Schema::hasColumn('productos', 'sku')) $table->string('sku')->nullable()->index();
                if (!Schema::hasColumn('productos', 'descripcion')) $table->text('descripcion')->nullable();
                if (!Schema::hasColumn('productos', 'meta')) $table->jsonb('meta')->nullable();
            });
        }

        // ordenes: extra checkout columns + unique folio
        if (Schema::hasTable('ordenes')) {
            Schema::table('ordenes', function (Blueprint $table) {
                if (!Schema::hasColumn('ordenes', 'folio')) $table->string('folio')->nullable();
                if (!Schema::hasColumn('ordenes', 'tipo_entrega')) $table->string('tipo_entrega')->nullable(); // pickup/delivery
                if (!Schema::hasColumn('ordenes', 'comprador_nombre')) $table->string('comprador_nombre')->nullable();
                if (!Schema::hasColumn('ordenes', 'comprador_whatsapp')) $table->string('comprador_whatsapp')->nullable()->index();
                if (!Schema::hasColumn('ordenes', 'comprador_email')) $table->string('comprador_email')->nullable()->index();
                if (!Schema::hasColumn('ordenes', 'subtotal')) $table->decimal('subtotal', 12, 2)->default(0);
                if (!Schema::hasColumn('ordenes', 'descuento')) $table->decimal('descuento', 12, 2)->default(0);
                if (!Schema::hasColumn('ordenes', 'envio')) $table->decimal('envio', 12, 2)->default(0);
                if (!Schema::hasColumn('ordenes', 'meta')) $table->jsonb('meta')->nullable();
            });

            // unique index for folio (only if not already)
            // Laravel can't "if has index" portably; we just try to add if column exists.
            // On Postgres, index names are global per schema.
            Schema::table('ordenes', function (Blueprint $table) {
                // use a fixed name to avoid duplicates
                $table->unique('folio', 'ordenes_folio_unique');
            });
        }

        // orden_items: empresa_id, nombre, total
        if (Schema::hasTable('orden_items')) {
            Schema::table('orden_items', function (Blueprint $table) {
                if (!Schema::hasColumn('orden_items', 'empresa_id')) $table->unsignedBigInteger('empresa_id')->nullable()->index();
                if (!Schema::hasColumn('orden_items', 'nombre')) $table->string('nombre')->nullable();
                if (!Schema::hasColumn('orden_items', 'total')) $table->decimal('total', 12, 2)->default(0);
            });
        }

        // orden_pagos: empresa_id, status, referencia, actor_usuario_id
        if (Schema::hasTable('orden_pagos')) {
            Schema::table('orden_pagos', function (Blueprint $table) {
                if (!Schema::hasColumn('orden_pagos', 'empresa_id')) $table->unsignedBigInteger('empresa_id')->nullable()->index();
                if (!Schema::hasColumn('orden_pagos', 'status')) $table->string('status')->default('pendiente')->index();
                if (!Schema::hasColumn('orden_pagos', 'referencia')) $table->string('referencia')->nullable()->index();
                if (!Schema::hasColumn('orden_pagos', 'actor_usuario_id')) $table->unsignedBigInteger('actor_usuario_id')->nullable()->index();
            });
        }

        // caja_turnos: abierto_at, cerrado_at, status, meta
        if (Schema::hasTable('caja_turnos')) {
            Schema::table('caja_turnos', function (Blueprint $table) {
                if (!Schema::hasColumn('caja_turnos', 'abierto_at')) $table->timestamp('abierto_at')->nullable()->index();
                if (!Schema::hasColumn('caja_turnos', 'cerrado_at')) $table->timestamp('cerrado_at')->nullable()->index();
                if (!Schema::hasColumn('caja_turnos', 'status')) $table->string('status')->default('abierto')->index();
                if (!Schema::hasColumn('caja_turnos', 'meta')) $table->jsonb('meta')->nullable();
            });
        }

        // caja_movimientos: empresa_id, tipo, metodo, orden_id, orden_pago_id, actor_usuario_id, nota
        if (Schema::hasTable('caja_movimientos')) {
            Schema::table('caja_movimientos', function (Blueprint $table) {
                if (!Schema::hasColumn('caja_movimientos', 'empresa_id')) $table->unsignedBigInteger('empresa_id')->nullable()->index();
                if (!Schema::hasColumn('caja_movimientos', 'tipo')) $table->string('tipo')->default('entrada')->index(); // entrada/salida
                if (!Schema::hasColumn('caja_movimientos', 'metodo')) $table->string('metodo')->default('cash')->index(); // cash/card/transfer
                if (!Schema::hasColumn('caja_movimientos', 'orden_id')) $table->unsignedBigInteger('orden_id')->nullable()->index();
                if (!Schema::hasColumn('caja_movimientos', 'orden_pago_id')) $table->unsignedBigInteger('orden_pago_id')->nullable()->index();
                if (!Schema::hasColumn('caja_movimientos', 'actor_usuario_id')) $table->unsignedBigInteger('actor_usuario_id')->nullable()->index();
                if (!Schema::hasColumn('caja_movimientos', 'nota')) $table->string('nota')->nullable();
            });
        }

        // whatsapp_logs: canal, template, evento, skipped_reason, payload, provider_response, error, orden_id, entrega_id
        if (Schema::hasTable('whatsapp_logs')) {
            Schema::table('whatsapp_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('whatsapp_logs', 'canal')) $table->string('canal')->default('whatsapp')->index();
                if (!Schema::hasColumn('whatsapp_logs', 'template')) $table->string('template')->nullable()->index();
                if (!Schema::hasColumn('whatsapp_logs', 'evento')) $table->string('evento')->nullable()->index();
                if (!Schema::hasColumn('whatsapp_logs', 'skipped_reason')) $table->string('skipped_reason')->nullable()->index();
                if (!Schema::hasColumn('whatsapp_logs', 'payload')) $table->jsonb('payload')->nullable();
                if (!Schema::hasColumn('whatsapp_logs', 'provider_response')) $table->jsonb('provider_response')->nullable();
                if (!Schema::hasColumn('whatsapp_logs', 'error')) $table->text('error')->nullable();
                if (!Schema::hasColumn('whatsapp_logs', 'orden_id')) $table->unsignedBigInteger('orden_id')->nullable()->index();
                if (!Schema::hasColumn('whatsapp_logs', 'entrega_id')) $table->unsignedBigInteger('entrega_id')->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        // No-op: this is a forward-only hotfix migration for production stability.
    }
};
