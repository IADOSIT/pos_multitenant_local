<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add image management fields to productos
        Schema::table('productos', function (Blueprint $table) {
            if (!Schema::hasColumn('productos', 'image_source')) {
                $table->string('image_source')->default('auto')->after('imagen_url');
                // Values: 'manual', 'auto', 'default'
            }
            if (!Schema::hasColumn('productos', 'use_auto_image')) {
                $table->boolean('use_auto_image')->default(true)->after('image_source');
            }
        });

        // Add user-empresa relationship for multi-empresa registration
        if (!Schema::hasTable('empresa_usuario')) {
            Schema::create('empresa_usuario', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('usuario_id');
                $table->unsignedBigInteger('empresa_id');
                $table->string('role')->default('cliente');
                $table->timestamps();

                $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('cascade');
                $table->foreign('empresa_id')->references('id')->on('empresas')->onDelete('cascade');
                $table->unique(['usuario_id', 'empresa_id']);
            });
        }

        // Dashboard alerts config
        if (!Schema::hasTable('alert_configs')) {
            Schema::create('alert_configs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empresa_id')->constrained()->onDelete('cascade');
                $table->string('alert_type'); // inventory_low, orders_pending, delivery_delayed, payments_pending
                $table->boolean('enabled')->default(true);
                $table->integer('threshold')->nullable(); // e.g., 10 for low inventory
                $table->string('notify_roles')->nullable(); // comma-separated roles
                $table->timestamps();

                $table->unique(['empresa_id', 'alert_type']);
            });
        }

        // Portal flyer products selection
        Schema::table('portal_config', function (Blueprint $table) {
            // portal_config already uses JSON value, we'll store flyer_products there
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn(['image_source', 'use_auto_image']);
        });

        Schema::dropIfExists('empresa_usuario');
        Schema::dropIfExists('alert_configs');
    }
};
