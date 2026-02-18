<?php

namespace App\Services\WhatsApp;

use App\Models\Orden;
use App\Models\WhatsappLog;
use App\Models\VendedorWhatsapp;
use App\Models\Cliente;

class OrderWhatsAppNotifier
{
    public function __construct(private WhatsAppSender $sender) {}

    private function shouldNotifyBuyer(Orden $orden): bool
    {
        if (!$orden->cliente_id) return true;
        $c = Cliente::find($orden->cliente_id);
        return $c ? (bool)$c->enviar_estatus : true;
    }

    public function onCreated(Orden $orden): void
    {
        $buyerMsg = $this->buildBuyerCreatedMessage($orden);
        $sellerMsg = $this->buildSellerCreatedMessage($orden);

        $this->notifyBuyer($orden, 'orden_creada', $buyerMsg);
        $this->notifySellers($orden, 'orden_creada', $sellerMsg);
    }

    private function buildBuyerCreatedMessage(Orden $orden): string
    {
        $lines = [
            "Hola {$orden->comprador_nombre}!",
            "",
            "Tu pedido *{$orden->folio}* fue recibido.",
            "",
        ];

        // Add items summary
        $items = $orden->items()->with('producto')->get();
        if ($items->count() > 0) {
            $lines[] = "*Productos:*";
            foreach ($items->take(5) as $item) {
                $nombre = $item->nombre ?? ($item->producto->nombre ?? 'Producto');
                $lines[] = "• {$item->cantidad}x {$nombre}";
            }
            if ($items->count() > 5) {
                $lines[] = "... y " . ($items->count() - 5) . " productos mas";
            }
            $lines[] = "";
        }

        $lines[] = "*Total:* $" . number_format((float)$orden->total, 2);

        // Fulfillment type
        $tipoLabel = $orden->tipo_entrega === 'delivery' ? 'Envio a domicilio' : 'Recoger en tienda';
        $lines[] = "*Tipo:* {$tipoLabel}";

        // Add ETA for pickup orders
        if ($orden->tipo_entrega === 'pickup' && $orden->estimated_ready_at) {
            $eta = $orden->estimated_ready_at;
            if ($eta->isToday()) {
                $etaText = 'Hoy a las ' . $eta->format('g:i A');
            } elseif ($eta->isTomorrow()) {
                $etaText = 'Manana a las ' . $eta->format('g:i A');
            } else {
                $etaText = $eta->format('d/m/Y') . ' a las ' . $eta->format('g:i A');
            }
            $lines[] = "";
            $lines[] = "*Listo para recoger:* {$etaText}";
            $lines[] = "Te avisaremos cuando este listo.";
        }

        return implode("\n", $lines);
    }

    private function buildSellerCreatedMessage(Orden $orden): string
    {
        $lines = [
            "*Nueva orden {$orden->folio}*",
            "",
            "Cliente: {$orden->comprador_nombre}",
            "WhatsApp: {$orden->comprador_whatsapp}",
            "Total: $" . number_format((float)$orden->total, 2),
            "Tipo: " . ($orden->tipo_entrega === 'delivery' ? 'Envio a domicilio' : 'Recoger en tienda'),
        ];

        // Add items summary
        $items = $orden->items()->with('producto')->get();
        if ($items->count() > 0) {
            $lines[] = "";
            $lines[] = "*Productos:*";
            foreach ($items as $item) {
                $nombre = $item->nombre ?? ($item->producto->nombre ?? 'Producto');
                $lines[] = "• {$item->cantidad}x {$nombre}";
            }
        }

        // Add ETA for pickup orders
        if ($orden->tipo_entrega === 'pickup' && $orden->estimated_ready_at) {
            $eta = $orden->estimated_ready_at;
            $etaText = $eta->format('d/m H:i');
            $lines[] = "";
            $lines[] = "*Pickup ETA:* {$etaText}";
        }

        return implode("\n", $lines);
    }

    public function onStatusChanged(Orden $orden, string $from): void
    {
        $buyerMsg = $this->buildBuyerStatusMessage($orden, $from);
        $sellerMsg = "Orden {$orden->folio} cambio: {$from} → {$orden->status}";

        $this->notifyBuyer($orden, 'status_changed', $buyerMsg);
        $this->notifySellers($orden, 'status_changed', $sellerMsg);
    }

    private function buildBuyerStatusMessage(Orden $orden, string $from): string
    {
        $statusLabels = [
            'creada' => 'Recibido',
            'preparando' => 'En preparacion',
            'lista' => 'Listo para recoger',
            'entregada' => 'Entregado',
            'cancelada' => 'Cancelado',
        ];

        $statusLabel = $statusLabels[$orden->status] ?? ucfirst($orden->status);

        $lines = [
            "Hola {$orden->comprador_nombre}!",
            "",
            "Tu pedido *{$orden->folio}* ha cambiado de estado:",
            "*{$statusLabel}*",
        ];

        // Special message when order is ready
        if ($orden->status === 'lista' && $orden->tipo_entrega === 'pickup') {
            $lines[] = "";
            $lines[] = "Tu pedido esta listo para recoger!";
            $lines[] = "Total a pagar: $" . number_format((float)$orden->total, 2);
        }

        return implode("\n", $lines);
    }

    private function notifyBuyer(Orden $orden, string $evento, string $text): void
    {
        if (!$this->shouldNotifyBuyer($orden)) {
            WhatsappLog::create([
                'empresa_id'=>$orden->empresa_id,
                'orden_id'=>$orden->id,
                'evento'=>$evento,
                'to_whatsapp'=>$orden->comprador_whatsapp,
                'status'=>'skipped',
                'skipped_reason'=>'opt_out',
                'payload'=>['text'=>$text,'type'=>'buyer'],
            ]);
            return;
        }

        $log = WhatsappLog::create([
            'empresa_id'=>$orden->empresa_id,
            'orden_id'=>$orden->id,
            'evento'=>$evento,
            'to_whatsapp'=>$orden->comprador_whatsapp,
            'status'=>'queued',
            'payload'=>['text'=>$text,'type'=>'buyer'],
        ]);
        $this->sender->dispatchLog($log);
    }

    private function notifySellers(Orden $orden, string $evento, string $text): void
    {
        $nums = VendedorWhatsapp::where('empresa_id',$orden->empresa_id)->where('activo',true)->pluck('whatsapp')->all();
        foreach ($nums as $to) {
            $log = WhatsappLog::create([
                'empresa_id'=>$orden->empresa_id,
                'orden_id'=>$orden->id,
                'evento'=>$evento,
                'to_whatsapp'=>$to,
                'status'=>'queued',
                'payload'=>['text'=>$text,'type'=>'seller'],
            ]);
            $this->sender->dispatchLog($log);
        }
    }
}
