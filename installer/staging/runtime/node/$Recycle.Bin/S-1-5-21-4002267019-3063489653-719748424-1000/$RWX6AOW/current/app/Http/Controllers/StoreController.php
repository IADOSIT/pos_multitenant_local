<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Producto;
use App\Models\Categoria;
use App\Models\Orden;
use App\Models\Flyer;

final class StoreController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $categoriaId = $request->query('categoria_id');

        // Get empresa_id from middleware (request attributes) or session
        $empresaId = $request->attributes->get('store_id')
            ?? (int) $request->session()->get('empresa_id', 1);

        $productos = Producto::query()
            ->with('categoria')
            ->where('empresa_id', $empresaId)
            ->when($q !== '', fn($qq) => $qq->where('nombre', 'ilike', "%{$q}%"))
            ->when($categoriaId, fn($qq) => $qq->where('categoria_id', $categoriaId))
            ->where('activo', true)
            ->orderBy('id', 'desc')
            ->paginate(12)
            ->withQueryString();

        $categorias = Categoria::where('empresa_id', $empresaId)->orderBy('nombre')->get();

        // Get active flyers for hero slider
        $flyers = Flyer::where('empresa_id', $empresaId)
            ->where('activo', true)
            ->orderBy('orden')
            ->limit(10)
            ->get();

        // Get current store for view
        $currentStore = $request->attributes->get('store');

        return view('store.index', compact('productos', 'categorias', 'q', 'categoriaId', 'flyers', 'currentStore'));
    }

    public function show(Producto $producto)
    {
        abort_unless($producto->activo, 404);
        return view('store.producto', compact('producto'));
    }

    public function track($folio)
    {
        $orden = Orden::where('folio', $folio)->firstOrFail();
        return view('store.track', compact('orden'));
    }

    public function thanks($folio)
    {
        $orden = Orden::where('folio', $folio)->first();

        if (!$orden) {
            return view('store.thanks', [
                'status' => 'failure',
                'message' => 'No encontramos el pedido especificado.',
                'orden' => null,
            ]);
        }

        // Determine status based on latest payment
        $latestPago = $orden->pagos()->latest()->first();
        $status = 'success';
        $message = 'Tu pedido ha sido recibido correctamente.';

        if ($latestPago) {
            switch ($latestPago->status) {
                case 'paid':
                case 'approved':
                    $status = 'success';
                    $message = 'Tu pago ha sido procesado exitosamente.';
                    break;
                case 'pending':
                case 'in_process':
                    $status = 'pending';
                    $message = 'Tu pago esta siendo procesado. Te notificaremos cuando se confirme.';
                    break;
                case 'failed':
                case 'rejected':
                case 'cancelled':
                    $status = 'failure';
                    $message = 'Hubo un problema con tu pago. Por favor intenta de nuevo.';
                    break;
            }
        }

        return view('store.thanks', compact('orden', 'status', 'message'));
    }
}