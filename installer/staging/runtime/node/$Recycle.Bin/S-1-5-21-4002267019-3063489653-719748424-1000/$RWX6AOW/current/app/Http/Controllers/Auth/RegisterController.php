<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;

class RegisterController extends Controller
{
    public function show()
    {
        // Get all active empresas for selection
        $empresas = Empresa::where('activa', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'handle', 'logo_url']);

        return view('auth.register', compact('empresas'));
    }

    public function register(Request $request)
    {
        // Rate limiting
        $key = 'register:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return back()->with('error', "Demasiados intentos. Intenta de nuevo en {$seconds} segundos.");
        }
        RateLimiter::hit($key, 300); // 5 attempts per 5 minutes

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:usuarios,email',
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'whatsapp' => 'nullable|string|max:20',
            'empresas' => 'nullable|array',
            'empresas.*' => 'exists:empresas,id',
        ]);

        $usuario = Usuario::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'whatsapp' => $data['whatsapp'] ?? null,
            'activo' => true,
        ]);

        // Get selected empresas (from form or session)
        $empresaIds = $data['empresas'] ?? [];
        $sessionEmpresaId = $request->session()->get('empresa_id');

        if (empty($empresaIds) && $sessionEmpresaId) {
            $empresaIds = [$sessionEmpresaId];
        }

        // Associate user with selected empresas
        if (!empty($empresaIds)) {
            foreach ($empresaIds as $empresaId) {
                DB::table('empresa_usuario')->insert([
                    'empresa_id' => $empresaId,
                    'usuario_id' => $usuario->id,
                    'role' => 'cliente',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Set first empresa as active
            $request->session()->put('empresa_id', $empresaIds[0]);
        }

        Auth::login($usuario);
        RateLimiter::clear($key);

        return redirect()->intended(route('store.home'))->with('ok', 'Cuenta creada correctamente');
    }
}
