<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    protected $table = 'categorias';
    protected $guarded = [];
    protected $casts = [
        'activa' => 'boolean',
    ];

    public function empresa() { return $this->belongsTo(Empresa::class); }
    public function productos() { return $this->hasMany(Producto::class, 'categoria_id'); }
}
