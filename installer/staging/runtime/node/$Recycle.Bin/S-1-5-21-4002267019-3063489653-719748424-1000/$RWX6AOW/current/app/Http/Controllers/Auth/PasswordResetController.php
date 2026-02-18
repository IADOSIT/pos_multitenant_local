<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    public function showRequestForm()
    {
        return view('auth.passwords.email');
    }

    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = Usuario::where('email', $request->email)->first();

        if (!$user) {
            return back()->with('status', 'Si el correo existe, recibiras un enlace de recuperacion.');
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $resetUrl = route('password.reset', ['token' => $token, 'email' => $request->email]);

        // Resolve empresa context for branding the email
        $empresa = $this->resolveEmpresaForUser($user);
        $appName = $empresa ? $empresa->getAppName() : config('app.name', 'EMC Abastos');
        $replyTo = $this->getReplyToEmail($empresa);

        try {
            Mail::send('emails.password-reset', [
                'resetUrl' => $resetUrl,
                'user' => $user,
                'appName' => $appName,
            ], function ($message) use ($request, $appName, $replyTo) {
                $message->to($request->email);
                $message->subject("Recuperar contrasena - {$appName}");

                if ($replyTo) {
                    $message->replyTo($replyTo, $appName);
                }
            });
        } catch (\Exception $e) {
            \Log::error('Password reset email failed: ' . $e->getMessage());
        }

        return back()->with('status', 'Si el correo existe, recibiras un enlace de recuperacion.');
    }

    public function showResetForm(Request $request, string $token)
    {
        return view('auth.passwords.reset', [
            'token' => $token,
            'email' => $request->query('email'),
        ]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return back()->withErrors(['email' => 'Token de recuperacion invalido.']);
        }

        if (!Hash::check($request->token, $record->token)) {
            return back()->withErrors(['email' => 'Token de recuperacion invalido.']);
        }

        if (Carbon::parse($record->created_at)->addHours(2)->isPast()) {
            return back()->withErrors(['email' => 'El token ha expirado. Solicita uno nuevo.']);
        }

        $user = Usuario::where('email', $request->email)->first();

        if (!$user) {
            return back()->withErrors(['email' => 'Usuario no encontrado.']);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return redirect()->route('login')->with('status', 'Contrasena actualizada correctamente. Inicia sesion.');
    }

    /**
     * Get the user's primary empresa for email branding.
     */
    private function resolveEmpresaForUser(Usuario $user): ?Empresa
    {
        $pivot = DB::table('empresa_usuario')
            ->where('usuario_id', $user->id)
            ->where('activo', true)
            ->first();

        if ($pivot) {
            return Empresa::find($pivot->empresa_id);
        }

        return null;
    }

    /**
     * Get reply-to email: empresa support_email > superadmin fallback.
     */
    private function getReplyToEmail(?Empresa $empresa): ?string
    {
        if ($empresa && !empty($empresa->support_email)) {
            return $empresa->support_email;
        }

        // Fallback: first superadmin email
        $superadmin = DB::table('empresa_usuario')
            ->join('roles', 'empresa_usuario.rol_id', '=', 'roles.id')
            ->join('usuarios', 'empresa_usuario.usuario_id', '=', 'usuarios.id')
            ->where('roles.slug', 'superadmin')
            ->select('usuarios.email')
            ->first();

        return $superadmin?->email;
    }
}
