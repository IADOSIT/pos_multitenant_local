<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('inventarios', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('empresa_id');
   $table->unsignedBigInteger('producto_id');
   $table->integer('stock')->default(0);
   $table->timestamps();
   $table->unique(['empresa_id','producto_id']);
  });
 }
 public function down(): void { Schema::dropIfExists('inventarios'); }
};