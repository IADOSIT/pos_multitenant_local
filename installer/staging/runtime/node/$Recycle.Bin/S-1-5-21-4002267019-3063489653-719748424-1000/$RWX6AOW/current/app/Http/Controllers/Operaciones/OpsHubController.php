<?php

namespace App\Http\Controllers\Operaciones;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OpsHubController extends Controller
{
    public function index(Request $request)
    {
        return view('operaciones.hub.index');
    }
}
