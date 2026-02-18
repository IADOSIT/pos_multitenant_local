<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('caja_movimientos', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('turno_id');
   $table->decimal('monto',12,2);
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('caja_movimientos'); }
};