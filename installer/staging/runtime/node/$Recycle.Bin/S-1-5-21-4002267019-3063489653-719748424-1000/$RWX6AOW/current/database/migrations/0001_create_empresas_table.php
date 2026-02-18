<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('empresas', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->string('nombre',160);
   $table->string('slug',120)->unique();
   $table->boolean('activa')->default(true);
   $table->string('brand_nombre_publico',200)->nullable();
   $table->string('brand_color',20)->nullable();
   $table->string('skin',80)->nullable();
   $table->jsonb('config')->nullable();
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('empresas'); }
};