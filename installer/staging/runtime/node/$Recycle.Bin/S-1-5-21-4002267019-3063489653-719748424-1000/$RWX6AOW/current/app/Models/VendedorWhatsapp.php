<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendedorWhatsapp extends Model
{
    protected $table = 'vendedor_whatsapps';
    protected $guarded = [];
    protected $casts = ['activo'=>'boolean'];
}
