<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('empresa_usuario', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('empresa_id');
   $table->unsignedBigInteger('usuario_id');
   $table->unsignedBigInteger('rol_id');
   $table->boolean('activo')->default(true);
   $table->timestamps();
   $table->unique(['empresa_id','usuario_id']);
  });
 }
 public function down(): void { Schema::dropIfExists('empresa_usuario'); }
};