<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class LoginController extends Controller
{
    public function show()
    {
        return view('auth.login');
    }

    /**
     * Get empresas for a user by email (AJAX endpoint)
     */
    public function getEmpresas(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario) {
            return response()->json(['empresas' => []]);
        }

        // Get empresas associated with this user
        $empresaIds = DB::table('empresa_usuario')
            ->where('usuario_id', $usuario->id)
            ->pluck('empresa_id');

        $empresas = Empresa::whereIn('id', $empresaIds)
            ->where('activa', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'logo_url', 'handle']);

        // Check if user is superadmin (can access all empresas)
        $isSuperAdmin = $usuario->isSuperAdmin();

        if ($isSuperAdmin) {
            $allEmpresas = Empresa::where('activa', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'logo_url', 'handle']);

            return response()->json([
                'empresas' => $allEmpresas,
                'is_superadmin' => true,
                'user_empresas' => $empresaIds->toArray(),
            ]);
        }

        return response()->json([
            'empresas' => $empresas,
            'is_superadmin' => false,
        ]);
    }

    protected function throttleKey(Request $request): string
    {
        return Str::lower($request->input('email')).'|'.$request->ip();
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required','email'],
            'password' => ['required','string'],
            'empresas' => ['nullable', 'array'],
            'empresas.*' => ['exists:empresas,id'],
        ]);

        $key = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($key, 10)) {
            $seconds = RateLimiter::availableIn($key);
            return back()->withErrors([
                'email' => "Demasiados intentos. Intenta de nuevo en {$seconds} segundos.",
            ])->onlyInput('email');
        }

        if (Auth::attempt($request->only('email','password'), $request->boolean('remember'))) {
            RateLimiter::clear($key);
            $request->session()->regenerate();

            $user = Auth::user();
            $selectedEmpresas = $request->input('empresas', []);

            // Get user's associated empresas
            $userEmpresaIds = DB::table('empresa_usuario')
                ->where('usuario_id', $user->id)
                ->pluck('empresa_id')
                ->toArray();

            // For superadmin, allow any empresa selection
            if ($user->isSuperAdmin()) {
                if (!empty($selectedEmpresas)) {
                    $empresaId = $selectedEmpresas[0];
                } elseif (!empty($userEmpresaIds)) {
                    $empresaId = $userEmpresaIds[0];
                } else {
                    // Get first active empresa
                    $empresa = Empresa::where('activa', true)->first();
                    $empresaId = $empresa?->id;
                }
            } else {
                // For regular users, only allow their associated empresas
                if (!empty($selectedEmpresas)) {
                    $validSelection = array_intersect($selectedEmpresas, $userEmpresaIds);
                    $empresaId = !empty($validSelection) ? reset($validSelection) : ($userEmpresaIds[0] ?? null);
                } else {
                    $empresaId = $userEmpresaIds[0] ?? null;
                }
            }

            // Set empresa in session
            if ($empresaId) {
                $empresa = Empresa::find($empresaId);
                if ($empresa) {
                    $request->session()->put('empresa_id', $empresa->id);
                    $request->session()->put('empresa_nombre', $empresa->nombre);
                }
            }

            return redirect()->intended(route('admin.dashboard'));
        }

        RateLimiter::hit($key, 60); // 1 min decay per attempt
        return back()->withErrors([
            'email' => 'Credenciales inválidas.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('store.home');
    }
}
