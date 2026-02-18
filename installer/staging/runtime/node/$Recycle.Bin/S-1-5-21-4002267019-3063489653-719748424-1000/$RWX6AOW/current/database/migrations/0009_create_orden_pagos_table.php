<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('orden_pagos', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('orden_id');
   $table->string('metodo',30);
   $table->decimal('monto',12,2);
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('orden_pagos'); }
};