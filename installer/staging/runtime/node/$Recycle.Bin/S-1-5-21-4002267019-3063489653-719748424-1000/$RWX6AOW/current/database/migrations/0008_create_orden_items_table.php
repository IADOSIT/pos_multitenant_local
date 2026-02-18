<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('orden_items', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('orden_id');
   $table->unsignedBigInteger('producto_id');
   $table->integer('cantidad');
   $table->decimal('precio',12,2);
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('orden_items'); }
};