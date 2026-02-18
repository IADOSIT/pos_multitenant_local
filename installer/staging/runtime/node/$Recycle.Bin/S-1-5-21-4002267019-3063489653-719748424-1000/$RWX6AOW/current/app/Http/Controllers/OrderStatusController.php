<?php

namespace App\Http\Controllers;

use App\Models\Orden;
use Illuminate\Http\Request;

class OrderStatusController extends Controller
{
    public function thanks(Request $request, string $folio)
    {
        $orden = Orden::where('folio',$folio)->with('items')->firstOrFail();

        if ($orden->tracking_token) {
            $request->session()->put('last_order_tracking', ['folio'=>$orden->folio,'token'=>$orden->tracking_token]);
        }

        return view('store.thanks', compact('orden'));
    }

    public function track(Request $request, string $folio)
    {
        $orden = Orden::where('folio',$folio)->with('items')->firstOrFail();

        $canSeePII = false;
        $sess = $request->session()->get('last_order_tracking');
        if (is_array($sess) && ($sess['folio'] ?? null) === $orden->folio && !empty($sess['token']) && hash_equals((string)$orden->tracking_token, (string)$sess['token'])) {
            $canSeePII = true;
        }

        return view('store.track', compact('orden','canSeePII'));
    }
}
