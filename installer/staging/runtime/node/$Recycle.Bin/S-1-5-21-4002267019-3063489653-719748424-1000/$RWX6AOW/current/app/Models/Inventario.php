<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventario extends Model
{
    protected $table = 'inventarios';
    protected $fillable = ['empresa_id','producto_id','stock'];

    public function empresa() { return $this->belongsTo(Empresa::class, 'empresa_id'); }
    public function producto() { return $this->belongsTo(Producto::class, 'producto_id'); }
}
