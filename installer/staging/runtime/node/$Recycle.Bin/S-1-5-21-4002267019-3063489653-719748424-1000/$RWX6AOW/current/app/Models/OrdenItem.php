<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenItem extends Model
{
    protected $table = 'orden_items';
    protected $guarded = [];

    public function orden() { return $this->belongsTo(Orden::class, 'orden_id'); }
    public function producto() { return $this->belongsTo(Producto::class, 'producto_id'); }
}
