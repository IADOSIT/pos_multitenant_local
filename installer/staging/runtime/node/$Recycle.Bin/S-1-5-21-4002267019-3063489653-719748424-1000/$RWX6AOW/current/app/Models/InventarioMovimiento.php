<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventarioMovimiento extends Model
{
    protected $table = 'inventario_movimientos';
    protected $guarded = [];
    protected $casts = ['meta'=>'array'];
}
