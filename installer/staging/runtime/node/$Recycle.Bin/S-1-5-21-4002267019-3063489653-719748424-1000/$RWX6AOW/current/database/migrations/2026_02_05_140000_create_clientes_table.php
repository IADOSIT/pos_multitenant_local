<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    if (!Schema::hasTable('clientes')) {
      Schema::create('clientes', function(Blueprint $t){
        $t->id();
        $t->unsignedBigInteger('empresa_id')->index();
        $t->string('nombre',180);
        $t->string('whatsapp',30)->index();
        $t->string('email',190)->nullable();
        $t->boolean('enviar_estatus')->default(true);
        $t->timestamps();
        $t->index(['empresa_id','created_at']);
      });
    }
    if (Schema::hasTable('ordenes') && !Schema::hasColumn('ordenes','cliente_id')) {
      Schema::table('ordenes', function(Blueprint $t){
        $t->unsignedBigInteger('cliente_id')->nullable()->index();
      });
    }
  }
  public function down(): void {}
};
