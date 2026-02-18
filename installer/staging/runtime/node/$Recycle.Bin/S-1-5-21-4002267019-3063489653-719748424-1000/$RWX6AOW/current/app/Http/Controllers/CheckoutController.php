<?php

namespace App\Http\Controllers;

use App\Models\Orden;
use App\Models\OrdenItem;
use App\Models\Producto;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Services\MercadoPagoService;
use App\Services\PickupEtaService;
use App\Services\WhatsApp\OrderWhatsAppNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    protected PickupEtaService $etaService;
    protected OrderWhatsAppNotifier $waNotifier;

    public function __construct(PickupEtaService $etaService, OrderWhatsAppNotifier $waNotifier)
    {
        $this->etaService = $etaService;
        $this->waNotifier = $waNotifier;
    }

    public function show()
    {
        $empresaId = (int) session('empresa_id', 0);
        $fullCart = session('cart', []);
        $cart = $fullCart[$empresaId] ?? [];

        if (empty($cart)) {
            return redirect()->route('cart.index')->withErrors(['cart' => 'Tu carrito está vacío.']);
        }

        $empresa = Empresa::find($empresaId);
        $hasMercadoPago = $empresa && $empresa->hasMercadoPago();

        // Calculate pickup ETA
        $pickupEta = null;
        $pickupEtaFormatted = null;
        if ($empresa) {
            $pickupEta = $this->etaService->calculateEta($empresa);
            $pickupEtaFormatted = $this->etaService->formatEta($pickupEta);
        }

        return view('store.checkout', compact('hasMercadoPago', 'empresa', 'pickupEta', 'pickupEtaFormatted'));
    }

    public function place(Request $request)
    {
        $request->validate([
            'comprador_nombre' => ['required', 'string', 'max:120'],
            'comprador_whatsapp' => ['required', 'string', 'max:40'],
            'comprador_email' => ['nullable', 'email', 'max:150'],
            'tipo_entrega' => ['nullable', 'in:pickup,delivery'],
            'metodo_pago' => ['nullable', 'in:efectivo,mercadopago'],
        ]);

        $empresaId = (int) session('empresa_id', 0);
        if (!$empresaId) {
            return redirect()->route('login')->withErrors(['empresa' => 'Selecciona una empresa antes de comprar.']);
        }

        $fullCart = session('cart', []);
        $cart = $fullCart[$empresaId] ?? [];
        if (empty($cart)) {
            return redirect()->route('cart.index')->withErrors(['cart' => 'Tu carrito está vacío.']);
        }

        // Normalize qty values (handle both ['qty' => n] and int formats)
        $normalizedCart = [];
        foreach ($cart as $pid => $item) {
            $normalizedCart[$pid] = is_array($item) ? ($item['qty'] ?? 1) : (int) $item;
        }
        $cart = $normalizedCart;

        $productos = Producto::whereIn('id', array_keys($cart))->get()->keyBy('id');

        foreach ($cart as $pid => $qty) {
            $p = $productos->get((int) $pid);
            if (!$p) return back()->withErrors(['cart' => 'Producto inválido.'])->withInput();
            if (isset($p->activo) && !$p->activo) {
                return back()->withErrors(['cart' => 'Tu carrito contiene productos inactivos.'])->withInput();
            }
            if ($qty < 1) return back()->withErrors(['cart' => 'Cantidad inválida.'])->withInput();
        }

        $empresa = Empresa::find($empresaId);

        $orden = DB::transaction(function () use ($request, $empresaId, $empresa, $cart, $productos) {
            // Upsert cliente
            $cliente = Cliente::upsertFromCheckout(
                $empresaId,
                $request->input('comprador_nombre'),
                $request->input('comprador_whatsapp'),
                $request->input('comprador_email')
            );

            // Generate unique folio
            do {
                $folio = 'EMC-' . strtoupper(Str::random(10));
            } while (Orden::where('folio', $folio)->exists());

            $subtotal = 0;
            foreach ($cart as $pid => $qty) {
                $p = $productos->get((int)$pid);
                $subtotal += ((float)$p->precio) * ((int)$qty);
            }

            // Calculate pickup ETA for pickup orders
            $tipoEntrega = $request->input('tipo_entrega', 'pickup');
            $estimatedReadyAt = null;
            if ($tipoEntrega === 'pickup' && $empresa) {
                $estimatedReadyAt = $this->etaService->calculateEta($empresa);
            }

            $orden = Orden::create([
                'empresa_id' => $empresaId,
                'cliente_id' => $cliente->id,
                'usuario_id' => auth()->id(),
                'folio' => $folio,
                'status' => 'creada',
                'tipo_entrega' => $tipoEntrega,
                'fulfillment_type' => $tipoEntrega,
                'estimated_ready_at' => $estimatedReadyAt,
                'comprador_nombre' => $request->input('comprador_nombre'),
                'comprador_whatsapp' => $request->input('comprador_whatsapp'),
                'comprador_email' => $request->input('comprador_email'),
                'subtotal' => $subtotal,
                'descuento' => 0,
                'envio' => 0,
                'total' => $subtotal,
                'meta' => [
                    'metodo_pago_preferido' => $request->input('metodo_pago', 'efectivo'),
                ],
            ]);

            foreach ($cart as $pid => $qty) {
                $p = $productos->get((int)$pid);
                $precio = (float)$p->precio;
                $total = $precio * (int)$qty;

                OrdenItem::create([
                    'orden_id' => $orden->id,
                    'empresa_id' => $empresaId,
                    'producto_id' => $p->id,
                    'nombre' => $p->nombre,
                    'precio' => $precio,
                    'cantidad' => (int)$qty,
                    'total' => $total,
                ]);
            }

            // Clear only this store's cart, preserve other stores
            $currentFullCart = session('cart', []);
            unset($currentFullCart[$empresaId]);
            if (empty($currentFullCart)) {
                session()->forget('cart');
            } else {
                session(['cart' => $currentFullCart]);
            }

            return $orden;
        });

        // Notify buyer + sellers via WhatsApp
        try {
            $this->waNotifier->onCreated($orden);
        } catch (\Exception $e) {
            \Log::error('WhatsApp notification error', ['error' => $e->getMessage()]);
        }

        // If MercadoPago selected and configured, redirect to payment
        if ($request->input('metodo_pago') === 'mercadopago') {
            try {
                if (MercadoPagoService::isConfigured($empresaId)) {
                    $mpService = new MercadoPagoService($empresaId);
                    $preference = $mpService->createPreference(
                        $orden,
                        route('checkout.success', $orden->folio),
                        route('checkout.failure', $orden->folio),
                        route('checkout.pending', $orden->folio)
                    );

                    return redirect($preference['init_point']);
                }
            } catch (\Exception $e) {
                // Log error but continue to thanks page
                \Log::error('MercadoPago error', ['error' => $e->getMessage()]);
            }
        }

        return redirect()->route('store.thanks', $orden->folio);
    }

    public function success(string $folio)
    {
        $orden = Orden::where('folio', $folio)->firstOrFail();
        return view('store.thanks', [
            'orden' => $orden,
            'status' => 'success',
            'message' => 'Tu pago fue procesado correctamente.',
        ]);
    }

    public function failure(string $folio)
    {
        $orden = Orden::where('folio', $folio)->firstOrFail();
        return view('store.thanks', [
            'orden' => $orden,
            'status' => 'failure',
            'message' => 'El pago no pudo ser procesado. Puedes intentar de nuevo o pagar en efectivo.',
        ]);
    }

    public function pending(string $folio)
    {
        $orden = Orden::where('folio', $folio)->firstOrFail();
        return view('store.thanks', [
            'orden' => $orden,
            'status' => 'pending',
            'message' => 'Tu pago está pendiente de confirmación.',
        ]);
    }
}
