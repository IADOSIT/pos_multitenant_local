<?php

namespace App\Jobs;

use App\Models\Producto;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FetchProductImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int \;

    public function __construct(int \)
    {
        \->productoId = \;
    }

    public function handle(): void
    {
        \ = Producto::find(\->productoId);
        if (!\ || data_get(\->meta, 'imagen_url')) {
            return;
        }

        // Lógica para buscar imagen aquí (por ejemplo, Pexels/Unsplash)
        // Por ahora: marca como "pending" para que puedas completar proveedor luego sin romper flujo.
        \->meta = ['imagen_url' => 'https://via.placeholder.com/150'];
        \->save();
    }
}
