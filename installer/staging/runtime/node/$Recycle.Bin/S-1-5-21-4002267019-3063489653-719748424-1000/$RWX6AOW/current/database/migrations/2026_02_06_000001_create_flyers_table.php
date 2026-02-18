<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flyers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id');
            $table->string('titulo')->nullable();
            $table->string('imagen_url');
            $table->string('alt_text')->nullable();
            $table->string('link_url')->nullable();
            $table->integer('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['empresa_id', 'activo', 'orden']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flyers');
    }
};
