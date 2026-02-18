<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('categorias', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('empresa_id');
   $table->string('nombre',160);
   $table->string('slug',160);
   $table->boolean('activa')->default(true);
   $table->timestamps();
   $table->unique(['empresa_id','slug']);
  });
 }
 public function down(): void { Schema::dropIfExists('categorias'); }
};