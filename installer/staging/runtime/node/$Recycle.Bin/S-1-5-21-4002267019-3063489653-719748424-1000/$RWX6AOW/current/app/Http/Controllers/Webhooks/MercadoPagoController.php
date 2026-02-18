<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\MercadoPagoService;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MercadoPagoController extends Controller
{
    public function handle(Request $request)
    {
        Log::info('MercadoPago webhook received', $request->all());

        $data = $request->all();

        // Extract empresa_id from metadata if available
        $empresaId = $data['data']['metadata']['empresa_id']
            ?? $request->query('empresa_id')
            ?? null;

        // If no empresa_id, try to find from the payment
        if (!$empresaId && isset($data['data']['id'])) {
            // Try each empresa that has MercadoPago configured
            $empresas = Empresa::whereNotNull('settings')
                ->where('activa', true)
                ->get();

            foreach ($empresas as $empresa) {
                if ($empresa->hasMercadoPago()) {
                    try {
                        $mpService = new MercadoPagoService($empresa->id);
                        if ($mpService->processWebhook($data)) {
                            return response()->json(['status' => 'ok']);
                        }
                    } catch (\Exception $e) {
                        Log::warning("MercadoPago webhook failed for empresa {$empresa->id}", [
                            'error' => $e->getMessage(),
                        ]);
                        continue;
                    }
                }
            }

            Log::warning('Could not process MercadoPago webhook - no matching empresa', $data);
            return response()->json(['status' => 'no_match'], 200);
        }

        if ($empresaId) {
            try {
                $mpService = new MercadoPagoService($empresaId);
                $mpService->processWebhook($data);
                return response()->json(['status' => 'ok']);
            } catch (\Exception $e) {
                Log::error('MercadoPago webhook error', [
                    'error' => $e->getMessage(),
                    'data' => $data,
                ]);
                return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
