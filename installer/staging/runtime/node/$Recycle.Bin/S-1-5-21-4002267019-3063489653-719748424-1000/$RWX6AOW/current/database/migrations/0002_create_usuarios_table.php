<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('usuarios', function (Blueprint $table) {
   $table->bigIncrements('id');
   $table->string('name',160);
   $table->string('email',180)->unique();
   $table->timestamp('email_verified_at')->nullable();
   $table->string('password');
   $table->string('whatsapp',32)->nullable();
   $table->string('telefono',32)->nullable();
   $table->rememberToken();
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('usuarios'); }
};