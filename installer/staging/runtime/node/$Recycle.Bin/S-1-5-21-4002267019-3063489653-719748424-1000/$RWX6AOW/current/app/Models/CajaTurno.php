<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CajaTurno extends Model
{
    protected $table = 'caja_turnos';
    protected $guarded = [];
    protected $casts = ['meta'=>'array','abierto_at'=>'datetime','cerrado_at'=>'datetime'];
}
