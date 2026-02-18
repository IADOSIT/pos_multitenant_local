<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    if (!Schema::hasTable('vendedor_whatsapps')) {
      Schema::create('vendedor_whatsapps', function(Blueprint $t){
        $t->id();
        $t->unsignedBigInteger('empresa_id')->index();
        $t->string('whatsapp',30);
        $t->boolean('activo')->default(true);
        $t->timestamps();
        $t->index(['empresa_id','activo']);
      });
    }
    if (Schema::hasTable('whatsapp_logs')) {
      Schema::table('whatsapp_logs', function(Blueprint $t){
        if (!Schema::hasColumn('whatsapp_logs','to_whatsapp')) $t->string('to_whatsapp',30)->nullable();
        if (!Schema::hasColumn('whatsapp_logs','status')) $t->string('status',20)->default('queued');
      });
    }
    if (Schema::hasTable('caja_movimientos')) {
      Schema::table('caja_movimientos', function(Blueprint $t){
        if (!Schema::hasColumn('caja_movimientos','monto')) $t->decimal('monto',12,2)->default(0);
        if (!Schema::hasColumn('caja_movimientos','turno_id')) $t->unsignedBigInteger('turno_id')->nullable()->index();
      });
    }
    if (Schema::hasTable('caja_turnos')) {
      Schema::table('caja_turnos', function(Blueprint $t){
        if (!Schema::hasColumn('caja_turnos','actor_usuario_id')) $t->unsignedBigInteger('actor_usuario_id')->nullable()->index();
      });
    }
  }
  public function down(): void {}
};
