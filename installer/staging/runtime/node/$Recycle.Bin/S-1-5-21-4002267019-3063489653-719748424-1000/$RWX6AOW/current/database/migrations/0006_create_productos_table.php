<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('productos', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('empresa_id');
   $table->unsignedBigInteger('categoria_id')->nullable();
   $table->string('nombre',200);
   $table->decimal('precio',12,2)->default(0);
   $table->boolean('activo')->default(true);
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('productos'); }
};