<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('caja_turnos', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('empresa_id');
   $table->unsignedBigInteger('usuario_id');
   $table->decimal('saldo_inicial',12,2)->default(0);
   $table->decimal('saldo_final_declarado',12,2)->nullable();
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('caja_turnos'); }
};