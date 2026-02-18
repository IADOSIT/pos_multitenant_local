<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';
    protected $guarded = [];

    protected $casts = [
        'enviar_estatus' => 'boolean',
        'meta' => 'array',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function ordenes()
    {
        return $this->hasMany(Orden::class, 'cliente_id');
    }

    public static function upsertFromCheckout(int $empresaId, string $nombre, string $whatsapp, ?string $email): self
    {
        $existing = self::where('empresa_id', $empresaId)
            ->where(function ($q) use ($whatsapp, $email) {
                $q->where('whatsapp', $whatsapp);
                if ($email) {
                    $q->orWhere('email', $email);
                }
            })
            ->first();

        if ($existing) {
            $existing->nombre = $nombre;
            $existing->whatsapp = $whatsapp;
            if ($email) {
                $existing->email = $email;
            }
            $existing->save();
            return $existing;
        }

        return self::create([
            'empresa_id' => $empresaId,
            'nombre' => $nombre,
            'whatsapp' => $whatsapp,
            'email' => $email,
            'enviar_estatus' => true,
        ]);
    }

    public function getTotalOrders(): int
    {
        return $this->ordenes()->count();
    }

    public function getTotalSpent(): float
    {
        return $this->ordenes()
            ->with('items')
            ->get()
            ->sum(fn($orden) => $orden->getTotal());
    }
}
