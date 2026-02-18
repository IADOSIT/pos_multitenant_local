<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappLog extends Model
{
    protected $table = 'whatsapp_logs';
    protected $guarded = [];
    protected $casts = ['payload'=>'array','provider_response'=>'array'];
}
