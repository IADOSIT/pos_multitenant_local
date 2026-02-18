<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AIHelpLog extends Model
{
    protected $table = 'ai_help_logs';

    protected $fillable = [
        'empresa_id',
        'usuario_id',
        'pregunta',
        'respuesta',
        'modelo',
        'tokens_input',
        'tokens_output',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }
}
