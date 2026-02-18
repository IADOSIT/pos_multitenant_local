<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\Orden;
use App\Models\OrdenPago;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MercadoPagoService
{
    private Empresa $empresa;
    private string $accessToken;
    private string $baseUrl = 'https://api.mercadopago.com';

    public function __construct(int $empresaId)
    {
        $this->empresa = Empresa::findOrFail($empresaId);
        $this->accessToken = $this->empresa->getMpAccessToken() ?? '';

        if (empty($this->accessToken)) {
            throw new \Exception('MercadoPago no está configurado para esta empresa');
        }
    }

    public function createPreference(Orden $orden, string $successUrl, string $failureUrl, string $pendingUrl): array
    {
        $items = [];
        foreach ($orden->items as $item) {
            $items[] = [
                'id' => (string) $item->producto_id,
                'title' => $item->nombre_snapshot ?? 'Producto',
                'quantity' => (int) $item->cantidad,
                'unit_price' => (float) $item->precio_unitario,
                'currency_id' => 'MXN',
            ];
        }

        $payload = [
            'items' => $items,
            'external_reference' => $orden->folio,
            'back_urls' => [
                'success' => $successUrl,
                'failure' => $failureUrl,
                'pending' => $pendingUrl,
            ],
            'auto_return' => 'approved',
            'notification_url' => route('webhooks.mercadopago'),
            'statement_descriptor' => substr($this->empresa->getAppName(), 0, 22),
            'metadata' => [
                'orden_id' => $orden->id,
                'empresa_id' => $this->empresa->id,
                'folio' => $orden->folio,
            ],
        ];

        // Add payer info if available
        if ($orden->cliente) {
            $payload['payer'] = [
                'name' => $orden->cliente->nombre,
                'email' => $orden->cliente->email ?? '',
                'phone' => [
                    'number' => $orden->cliente->whatsapp ?? '',
                ],
            ];
        }

        $response = Http::withToken($this->accessToken)
            ->post("{$this->baseUrl}/checkout/preferences", $payload);

        if (!$response->successful()) {
            Log::error('MercadoPago preference error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Error al crear preferencia de pago: ' . $response->body());
        }

        $data = $response->json();

        // Create payment record
        OrdenPago::create([
            'empresa_id' => $this->empresa->id,
            'orden_id' => $orden->id,
            'metodo' => 'mercadopago',
            'provider' => 'mercadopago',
            'provider_id' => $data['id'],
            'monto' => $orden->getTotal(),
            'status' => 'pending',
            'provider_response' => $data,
        ]);

        return [
            'preference_id' => $data['id'],
            'init_point' => $data['init_point'],
            'sandbox_init_point' => $data['sandbox_init_point'] ?? null,
        ];
    }

    public function getPaymentStatus(string $paymentId): ?array
    {
        $response = Http::withToken($this->accessToken)
            ->get("{$this->baseUrl}/v1/payments/{$paymentId}");

        if (!$response->successful()) {
            return null;
        }

        $data = $response->json();

        return [
            'status' => $this->mapStatus($data['status'] ?? 'unknown'),
            'status_detail' => $data['status_detail'] ?? null,
            'payment_method' => $data['payment_method_id'] ?? null,
            'transaction_amount' => $data['transaction_amount'] ?? 0,
            'date_approved' => $data['date_approved'] ?? null,
            'raw' => $data,
        ];
    }

    public function processWebhook(array $data): bool
    {
        $type = $data['type'] ?? $data['action'] ?? null;
        $paymentId = $data['data']['id'] ?? null;

        if (!$paymentId) {
            Log::warning('MercadoPago webhook without payment ID', $data);
            return false;
        }

        // Get payment details
        $paymentInfo = $this->getPaymentStatus($paymentId);
        if (!$paymentInfo) {
            Log::error('Could not get payment info from MercadoPago', ['payment_id' => $paymentId]);
            return false;
        }

        // Find the order payment by provider_id or external_reference
        $externalRef = $paymentInfo['raw']['external_reference'] ?? null;

        $ordenPago = OrdenPago::where('provider', 'mercadopago')
            ->where(function ($q) use ($paymentId, $externalRef) {
                $q->where('provider_id', $paymentId);
                if ($externalRef) {
                    $q->orWhereHas('orden', function ($q2) use ($externalRef) {
                        $q2->where('folio', $externalRef);
                    });
                }
            })
            ->first();

        if (!$ordenPago && $externalRef) {
            // Try to find orden by folio and create payment record
            $orden = Orden::where('folio', $externalRef)->first();
            if ($orden) {
                $ordenPago = OrdenPago::create([
                    'empresa_id' => $orden->empresa_id,
                    'orden_id' => $orden->id,
                    'metodo' => 'mercadopago',
                    'provider' => 'mercadopago',
                    'provider_id' => $paymentId,
                    'monto' => $paymentInfo['transaction_amount'] ?? $orden->getTotal(),
                    'status' => $paymentInfo['status'],
                    'provider_response' => $paymentInfo['raw'],
                ]);
            }
        }

        if ($ordenPago) {
            $ordenPago->update([
                'status' => $paymentInfo['status'],
                'provider_id' => $paymentId,
                'provider_response' => $paymentInfo['raw'],
            ]);

            Log::info('MercadoPago payment updated', [
                'orden_pago_id' => $ordenPago->id,
                'status' => $paymentInfo['status'],
            ]);

            return true;
        }

        Log::warning('Could not find orden for MercadoPago webhook', [
            'payment_id' => $paymentId,
            'external_reference' => $externalRef,
        ]);

        return false;
    }

    private function mapStatus(string $mpStatus): string
    {
        return match ($mpStatus) {
            'approved' => 'paid',
            'pending', 'in_process', 'authorized' => 'pending',
            'rejected', 'cancelled' => 'failed',
            'refunded', 'charged_back' => 'refunded',
            default => 'pending',
        };
    }

    public static function isConfigured(int $empresaId): bool
    {
        $empresa = Empresa::find($empresaId);
        return $empresa && $empresa->hasMercadoPago();
    }
}
