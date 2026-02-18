<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Import extends Model
{
    protected $table = 'imports';

    protected $fillable = [
        'tipo',
        'empresa_id',
        'usuario_id',
        'archivo',
        'status',
        'total_rows',
        'imported',
        'updated',
        'skipped',
        'errors',
        'error_details',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'error_details' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function getDurationAttribute(): ?string
    {
        if (!$this->started_at || !$this->finished_at) return null;
        $seconds = $this->finished_at->diffInSeconds($this->started_at);
        return $seconds < 60 ? "{$seconds}s" : round($seconds / 60, 1) . 'min';
    }
}
