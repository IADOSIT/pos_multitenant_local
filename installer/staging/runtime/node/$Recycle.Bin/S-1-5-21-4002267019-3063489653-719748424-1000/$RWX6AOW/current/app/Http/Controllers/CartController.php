<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Producto;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Resolve the current store's empresa_id from request context.
     */
    private function getStoreEmpresaId(Request $request): int
    {
        return (int) ($request->attributes->get('store_id')
            ?? $request->session()->get('empresa_id', 0));
    }

    /**
     * Get cart items scoped to the current store empresa.
     * Automatically migrates old flat format to new nested format.
     */
    private function getStoreCart(Request $request): array
    {
        $empresaId = $this->getStoreEmpresaId($request);
        $cart = session('cart', []);

        // Migrate old flat format (producto_id => qty/array)
        if (!empty($cart) && !$this->isNewFormat($cart)) {
            $cart = [$empresaId => $cart];
            session(['cart' => $cart]);
        }

        return $cart[$empresaId] ?? [];
    }

    /**
     * Save cart items for the current store empresa.
     */
    private function saveStoreCart(Request $request, array $items): void
    {
        $empresaId = $this->getStoreEmpresaId($request);
        $cart = session('cart', []);

        // Migrate old flat format
        if (!empty($cart) && !$this->isNewFormat($cart)) {
            $cart = [$empresaId => $cart];
        }

        if (empty($items)) {
            unset($cart[$empresaId]);
        } else {
            $cart[$empresaId] = $items;
        }

        session(['cart' => $cart]);
    }

    /**
     * Detect whether the cart uses the new nested format (empresa_id => items)
     * vs the old flat format (producto_id => qty).
     */
    private function isNewFormat(array $cart): bool
    {
        foreach ($cart as $key => $value) {
            if (is_int($value) || (is_array($value) && isset($value['qty']))) {
                return false; // Old format: producto_id => int|['qty'=>n]
            }
            if (is_array($value) && !isset($value['qty'])) {
                return true; // New format: empresa_id => [producto_id => ...]
            }
        }
        return true; // Empty or ambiguous = treat as new
    }

    /**
     * Display the cart page
     */
    public function index(Request $request)
    {
        $empresaId = $this->getStoreEmpresaId($request);
        $storeCart = $this->getStoreCart($request);
        $items = [];
        $total = 0;

        foreach ($storeCart as $productId => $item) {
            $producto = Producto::find($productId);
            if ($producto) {
                $qty = is_array($item) ? ($item['qty'] ?? 1) : (int) $item;
                $subtotal = $producto->precio * $qty;
                $items[] = [
                    'producto' => $producto,
                    'qty' => $qty,
                    'subtotal' => $subtotal,
                ];
                $total += $subtotal;
            }
        }

        $empresa = Empresa::find($empresaId);

        return view('store.cart', compact('items', 'total', 'empresa'));
    }

    /**
     * Add item to cart (AJAX)
     */
    public function add(Request $request)
    {
        $empresaId = $this->getStoreEmpresaId($request);
        $storeCart = $this->getStoreCart($request);
        $productId = $request->input('producto_id');
        $qty = max(1, (int) $request->input('qty', 1));

        $producto = Producto::find($productId);
        if (!$producto) {
            return response()->json(['success' => false, 'message' => 'Producto no encontrado'], 404);
        }

        // Validate product belongs to this store
        if ((int) $producto->empresa_id !== $empresaId) {
            return response()->json(['success' => false, 'message' => 'Este producto no pertenece a esta tienda.'], 422);
        }

        if (isset($storeCart[$productId])) {
            $currentQty = is_array($storeCart[$productId]) ? ($storeCart[$productId]['qty'] ?? 0) : (int) $storeCart[$productId];
            $storeCart[$productId] = ['qty' => $currentQty + $qty];
        } else {
            $storeCart[$productId] = ['qty' => $qty];
        }

        $this->saveStoreCart($request, $storeCart);

        return response()->json([
            'success' => true,
            'cart_count' => $this->getCartCount($storeCart),
            'cart_total' => $this->getCartTotal($storeCart),
            'cart_total_formatted' => '$' . number_format($this->getCartTotal($storeCart), 2),
            'message' => 'Producto agregado al carrito',
        ]);
    }

    /**
     * Update item quantity (form or AJAX)
     */
    public function update(Request $request)
    {
        $storeCart = $this->getStoreCart($request);
        $productId = $request->input('producto_id');
        $qty = max(0, (int) $request->input('qty', 1));

        if ($qty === 0) {
            unset($storeCart[$productId]);
        } elseif (isset($storeCart[$productId])) {
            $storeCart[$productId] = ['qty' => $qty];
        }

        $this->saveStoreCart($request, $storeCart);

        $count = $this->getCartCount($storeCart);
        $total = $this->getCartTotal($storeCart);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'cart_count' => $count,
                'cart_total' => $total,
                'cart_total_formatted' => '$' . number_format($total, 2),
            ]);
        }

        return redirect()->route('cart.index')->with('ok', 'Carrito actualizado');
    }

    /**
     * Remove item from cart (AJAX)
     */
    public function remove(Request $request)
    {
        $storeCart = $this->getStoreCart($request);
        $productId = $request->input('producto_id');

        if (isset($storeCart[$productId])) {
            unset($storeCart[$productId]);
            $this->saveStoreCart($request, $storeCart);
        }

        return response()->json([
            'success' => true,
            'cart_count' => $this->getCartCount($storeCart),
            'cart_total' => $this->getCartTotal($storeCart),
            'cart_total_formatted' => '$' . number_format($this->getCartTotal($storeCart), 2),
        ]);
    }

    /**
     * Clear the cart for the current store only
     */
    public function clear(Request $request)
    {
        $this->saveStoreCart($request, []);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'cart_count' => 0,
                'cart_total' => 0,
                'cart_total_formatted' => '$0.00',
            ]);
        }

        return redirect()->route('cart.index')->with('ok', 'Carrito vaciado');
    }

    /**
     * Get cart summary (AJAX)
     */
    public function summary(Request $request)
    {
        $storeCart = $this->getStoreCart($request);

        return response()->json([
            'cart_count' => $this->getCartCount($storeCart),
            'cart_total' => $this->getCartTotal($storeCart),
            'cart_total_formatted' => '$' . number_format($this->getCartTotal($storeCart), 2),
        ]);
    }

    /**
     * Get total item count from cart items array
     */
    private function getCartCount(array $cart): int
    {
        $count = 0;
        foreach ($cart as $item) {
            $count += is_array($item) ? ($item['qty'] ?? 1) : (int) $item;
        }
        return $count;
    }

    /**
     * Get total price from cart items array
     */
    private function getCartTotal(array $cart): float
    {
        $total = 0;
        $productIds = array_keys($cart);
        $productos = Producto::whereIn('id', $productIds)->get()->keyBy('id');

        foreach ($cart as $productId => $item) {
            $producto = $productos->get((int) $productId);
            if ($producto) {
                $qty = is_array($item) ? ($item['qty'] ?? 1) : (int) $item;
                $total += $producto->precio * $qty;
            }
        }
        return $total;
    }
}
