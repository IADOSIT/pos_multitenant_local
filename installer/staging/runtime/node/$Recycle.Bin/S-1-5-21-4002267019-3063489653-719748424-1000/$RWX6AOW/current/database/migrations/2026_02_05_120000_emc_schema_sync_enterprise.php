<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // categorias
        if (Schema::hasTable('categorias')) {
            Schema::table('categorias', function (Blueprint $table) {
                if (!Schema::hasColumn('categorias','activa')) $table->boolean('activa')->default(true);
                if (!Schema::hasColumn('categorias','slug')) $table->string('slug',190)->nullable();
                if (!Schema::hasColumn('categorias','orden')) $table->integer('orden')->nullable();
            });

            try { Schema::table('categorias', fn(Blueprint $t) => $t->index(['empresa_id'])); } catch (\Throwable $e) {}
            try { Schema::table('categorias', fn(Blueprint $t) => $t->unique(['empresa_id','slug'])); } catch (\Throwable $e) {}
        }

        // productos
        if (Schema::hasTable('productos')) {
            Schema::table('productos', function (Blueprint $table) {
                if (!Schema::hasColumn('productos','categoria_id')) $table->unsignedBigInteger('categoria_id')->nullable();
                if (!Schema::hasColumn('productos','sku')) $table->string('sku',80)->nullable();
                if (!Schema::hasColumn('productos','descripcion')) $table->text('descripcion')->nullable();
                if (!Schema::hasColumn('productos','meta')) $table->jsonb('meta')->nullable();
                if (!Schema::hasColumn('productos','activo')) $table->boolean('activo')->default(true);
            });

            try { Schema::table('productos', fn(Blueprint $t) => $t->index(['empresa_id'])); } catch (\Throwable $e) {}
            try { Schema::table('productos', fn(Blueprint $t) => $t->index(['empresa_id','categoria_id'])); } catch (\Throwable $e) {}
            try { Schema::table('productos', fn(Blueprint $t) => $t->index(['empresa_id','created_at'])); } catch (\Throwable $e) {}
        }

        // ordenes
        if (Schema::hasTable('ordenes')) {
            Schema::table('ordenes', function (Blueprint $table) {
                if (!Schema::hasColumn('ordenes','folio')) $table->string('folio',60)->nullable();
                if (!Schema::hasColumn('ordenes','tipo_entrega')) $table->string('tipo_entrega',30)->nullable();
                if (!Schema::hasColumn('ordenes','comprador_nombre')) $table->string('comprador_nombre',180)->nullable();
                if (!Schema::hasColumn('ordenes','comprador_whatsapp')) $table->string('comprador_whatsapp',30)->nullable();
                if (!Schema::hasColumn('ordenes','comprador_email')) $table->string('comprador_email',190)->nullable();
                if (!Schema::hasColumn('ordenes','subtotal')) $table->decimal('subtotal',12,2)->default(0);
                if (!Schema::hasColumn('ordenes','descuento')) $table->decimal('descuento',12,2)->default(0);
                if (!Schema::hasColumn('ordenes','envio')) $table->decimal('envio',12,2)->default(0);
                if (!Schema::hasColumn('ordenes','meta')) $table->jsonb('meta')->nullable();
                if (!Schema::hasColumn('ordenes','tracking_token')) $table->string('tracking_token',120)->nullable();
            });

            try { Schema::table('ordenes', fn(Blueprint $t) => $t->unique(['empresa_id','folio'])); } catch (\Throwable $e) {}
            try { Schema::table('ordenes', fn(Blueprint $t) => $t->index(['empresa_id','created_at'])); } catch (\Throwable $e) {}
            try { Schema::table('ordenes', fn(Blueprint $t) => $t->index(['empresa_id','status','created_at'])); } catch (\Throwable $e) {}
        }

        // orden_items
        if (Schema::hasTable('orden_items')) {
            Schema::table('orden_items', function (Blueprint $table) {
                if (!Schema::hasColumn('orden_items','empresa_id')) $table->unsignedBigInteger('empresa_id')->nullable();
                if (!Schema::hasColumn('orden_items','nombre')) $table->string('nombre',220)->nullable();
                if (!Schema::hasColumn('orden_items','total')) $table->decimal('total',12,2)->default(0);
            });

            try { Schema::table('orden_items', fn(Blueprint $t) => $t->index(['empresa_id','orden_id'])); } catch (\Throwable $e) {}
        }

        // orden_pagos
        if (Schema::hasTable('orden_pagos')) {
            Schema::table('orden_pagos', function (Blueprint $table) {
                if (!Schema::hasColumn('orden_pagos','empresa_id')) $table->unsignedBigInteger('empresa_id')->nullable();
                if (!Schema::hasColumn('orden_pagos','status')) $table->string('status',30)->default('pendiente');
                if (!Schema::hasColumn('orden_pagos','referencia')) $table->string('referencia',120)->nullable();
                if (!Schema::hasColumn('orden_pagos','actor_usuario_id')) $table->unsignedBigInteger('actor_usuario_id')->nullable();
            });

            try { Schema::table('orden_pagos', fn(Blueprint $t) => $t->index(['empresa_id','orden_id'])); } catch (\Throwable $e) {}
            try { Schema::table('orden_pagos', fn(Blueprint $t) => $t->index(['empresa_id','created_at'])); } catch (\Throwable $e) {}
        }

        // caja_turnos
        if (Schema::hasTable('caja_turnos')) {
            Schema::table('caja_turnos', function (Blueprint $table) {
                if (!Schema::hasColumn('caja_turnos','abierto_at')) $table->timestamp('abierto_at')->nullable();
                if (!Schema::hasColumn('caja_turnos','cerrado_at')) $table->timestamp('cerrado_at')->nullable();
                if (!Schema::hasColumn('caja_turnos','status')) $table->string('status',30)->default('abierto');
                if (!Schema::hasColumn('caja_turnos','meta')) $table->jsonb('meta')->nullable();
            });

            try { Schema::table('caja_turnos', fn(Blueprint $t) => $t->index(['empresa_id','created_at'])); } catch (\Throwable $e) {}
        }

        // caja_movimientos
        if (Schema::hasTable('caja_movimientos')) {
            Schema::table('caja_movimientos', function (Blueprint $table) {
                if (!Schema::hasColumn('caja_movimientos','empresa_id')) $table->unsignedBigInteger('empresa_id')->nullable();
                if (!Schema::hasColumn('caja_movimientos','tipo')) $table->string('tipo',30)->nullable();
                if (!Schema::hasColumn('caja_movimientos','metodo')) $table->string('metodo',30)->nullable();
                if (!Schema::hasColumn('caja_movimientos','orden_id')) $table->unsignedBigInteger('orden_id')->nullable();
                if (!Schema::hasColumn('caja_movimientos','orden_pago_id')) $table->unsignedBigInteger('orden_pago_id')->nullable();
                if (!Schema::hasColumn('caja_movimientos','actor_usuario_id')) $table->unsignedBigInteger('actor_usuario_id')->nullable();
                if (!Schema::hasColumn('caja_movimientos','nota')) $table->string('nota',255)->nullable();
            });

            try { Schema::table('caja_movimientos', fn(Blueprint $t) => $t->index(['empresa_id','created_at'])); } catch (\Throwable $e) {}
            try { Schema::table('caja_movimientos', fn(Blueprint $t) => $t->index(['empresa_id','metodo','created_at'])); } catch (\Throwable $e) {}
        }

        // whatsapp_logs
        if (Schema::hasTable('whatsapp_logs')) {
            Schema::table('whatsapp_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('whatsapp_logs','empresa_id')) $table->unsignedBigInteger('empresa_id')->nullable();
                if (!Schema::hasColumn('whatsapp_logs','canal')) $table->string('canal',30)->nullable();
                if (!Schema::hasColumn('whatsapp_logs','template')) $table->string('template',80)->nullable();
                if (!Schema::hasColumn('whatsapp_logs','evento')) $table->string('evento',80)->nullable();
                if (!Schema::hasColumn('whatsapp_logs','skipped_reason')) $table->string('skipped_reason',120)->nullable();
                if (!Schema::hasColumn('whatsapp_logs','payload')) $table->jsonb('payload')->nullable();
                if (!Schema::hasColumn('whatsapp_logs','provider_response')) $table->jsonb('provider_response')->nullable();
                if (!Schema::hasColumn('whatsapp_logs','error')) $table->text('error')->nullable();
                if (!Schema::hasColumn('whatsapp_logs','orden_id')) $table->unsignedBigInteger('orden_id')->nullable();
                if (!Schema::hasColumn('whatsapp_logs','entrega_id')) $table->unsignedBigInteger('entrega_id')->nullable();
            });

            try { Schema::table('whatsapp_logs', fn(Blueprint $t) => $t->index(['empresa_id','created_at'])); } catch (\Throwable $e) {}
            try { Schema::table('whatsapp_logs', fn(Blueprint $t) => $t->index(['empresa_id','evento','created_at'])); } catch (\Throwable $e) {}
        }
    }

    public function down(): void
    {
        // additive migration; no down
    }
};
