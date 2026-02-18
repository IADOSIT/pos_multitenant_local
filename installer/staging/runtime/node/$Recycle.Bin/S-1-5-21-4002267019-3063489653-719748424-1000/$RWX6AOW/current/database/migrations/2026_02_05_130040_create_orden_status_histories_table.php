<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('orden_status_histories')) {
            Schema::create('orden_status_histories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('empresa_id')->index();
                $table->unsignedBigInteger('orden_id')->index();
                $table->string('from_status', 40)->nullable();
                $table->string('to_status', 40);
                $table->unsignedBigInteger('actor_usuario_id')->nullable()->index();
                $table->string('nota', 255)->nullable();
                $table->timestamps();

                $table->index(['empresa_id','orden_id','created_at']);
            });
        }
    }
    public function down(): void {
        Schema::dropIfExists('orden_status_histories');
    }
};
