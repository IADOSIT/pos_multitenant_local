<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Orden extends Model
{
    protected $table = 'ordenes';
    protected $guarded = [];

    protected $casts = [
        'meta' => 'array',
        'estimated_ready_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrdenItem::class, 'orden_id');
    }

    public function pagos()
    {
        return $this->hasMany(OrdenPago::class, 'orden_id');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function getTotal(): float
    {
        return $this->items->sum(fn($item) => $item->cantidad * $item->precio_unitario);
    }

    public function isPaid(): bool
    {
        return $this->pagos()->where('status', 'paid')->exists();
    }

    public function getPendingAmount(): float
    {
        $paid = $this->pagos()->where('status', 'paid')->sum('monto');
        return max(0, $this->getTotal() - $paid);
    }
}
