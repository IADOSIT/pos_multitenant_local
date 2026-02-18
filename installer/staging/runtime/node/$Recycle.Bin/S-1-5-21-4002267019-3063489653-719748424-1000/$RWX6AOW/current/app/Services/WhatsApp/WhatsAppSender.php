<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsappLog;
use Illuminate\Support\Facades\Bus;

class WhatsAppSender
{
    public function dispatchLog(WhatsappLog $log): void
    {
        // Para producción, reemplazar por proveedor real.
        // En demo: marcamos como sent inmediatamente.
        $log->status = 'sent';
        $log->provider_response = ['mock'=>true,'sent_at'=>now()->toDateTimeString()];
        $log->save();
    }

    public function retryLog(WhatsappLog $log): void
    {
        $log->status = 'queued';
        $log->error = null;
        $log->save();
        // demo: enviar inmediato
        $this->dispatchLog($log);
    }
}
