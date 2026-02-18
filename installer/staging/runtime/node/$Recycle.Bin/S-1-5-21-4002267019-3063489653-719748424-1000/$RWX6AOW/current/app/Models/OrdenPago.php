<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenPago extends Model
{
    protected $table = 'orden_pagos';
    protected $guarded = [];

    protected $casts = [
        'meta' => 'array',
        'provider_response' => 'array',
    ];

    public function orden()
    {
        return $this->belongsTo(Orden::class, 'orden_id');
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function getStatusLabel(): string
    {
        return match ($this->status) {
            'paid' => 'Pagado',
            'pending' => 'Pendiente',
            'failed' => 'Fallido',
            'refunded' => 'Reembolsado',
            default => ucfirst($this->status ?? 'Desconocido'),
        };
    }

    public function getStatusColor(): string
    {
        return match ($this->status) {
            'paid' => 'green',
            'pending' => 'yellow',
            'failed' => 'red',
            'refunded' => 'gray',
            default => 'gray',
        };
    }
}
