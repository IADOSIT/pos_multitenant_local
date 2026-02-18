<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('whatsapp_logs', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->unsignedBigInteger('empresa_id');
   $table->string('to',40)->nullable();
   $table->string('status',20)->default('queued');
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('whatsapp_logs'); }
};