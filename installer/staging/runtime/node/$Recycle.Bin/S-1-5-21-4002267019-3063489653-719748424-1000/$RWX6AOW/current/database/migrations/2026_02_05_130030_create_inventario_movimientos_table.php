<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('inventario_movimientos')) {
            Schema::create('inventario_movimientos', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('empresa_id')->index();
                $table->unsignedBigInteger('producto_id')->index();
                $table->string('tipo', 40); // ajuste|venta|compra|merma
                $table->integer('cantidad');
                $table->string('ref_tipo', 40)->nullable(); // orden|manual
                $table->unsignedBigInteger('ref_id')->nullable();
                $table->unsignedBigInteger('actor_usuario_id')->nullable()->index();
                $table->jsonb('meta')->nullable();
                $table->timestamps();

                $table->index(['empresa_id','producto_id','created_at']);
            });
        }
    }
    public function down(): void {
        Schema::dropIfExists('inventario_movimientos');
    }
};
