<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('ordenes', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('empresa_id');
   $table->unsignedBigInteger('usuario_id')->nullable();
   $table->string('status',40)->default('pending');
   $table->decimal('total',12,2)->default(0);
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('ordenes'); }
};