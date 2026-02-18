<?php

namespace App\Services;

use App\Models\Usuario;
use App\Models\Empresa;
use Illuminate\Support\Facades\Log;

class WhatsAppCredentialService
{
    protected $whatsappService;

    public function __construct()
    {
        $this->whatsappService = app(\App\Services\WhatsAppService::class);
    }

    /**
     * Send credentials to a user via WhatsApp
     */
    public function sendCredentials(Usuario $usuario, string $password, ?Empresa $empresa = null): bool
    {
        try {
            $phone = $usuario->whatsapp ?? $usuario->telefono;

            if (empty($phone)) {
                Log::warning('WhatsAppCredentialService: No phone number for user', ['user_id' => $usuario->id]);
                return false;
            }

            $empresaNombre = $empresa ? $empresa->nombre : 'EMC Abastos';
            $loginUrl = url('/login');

            $message = $this->buildCredentialMessage($usuario, $password, $empresaNombre, $loginUrl);

            return $this->whatsappService->sendText($phone, $message);
        } catch (\Exception $e) {
            Log::error('WhatsAppCredentialService: Error sending credentials', [
                'user_id' => $usuario->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send password reset notification via WhatsApp
     */
    public function sendPasswordReset(Usuario $usuario, string $newPassword, ?Empresa $empresa = null): bool
    {
        try {
            $phone = $usuario->whatsapp ?? $usuario->telefono;

            if (empty($phone)) {
                Log::warning('WhatsAppCredentialService: No phone number for password reset', ['user_id' => $usuario->id]);
                return false;
            }

            $empresaNombre = $empresa ? $empresa->nombre : 'EMC Abastos';
            $loginUrl = url('/login');

            $message = $this->buildPasswordResetMessage($usuario, $newPassword, $empresaNombre, $loginUrl);

            return $this->whatsappService->sendText($phone, $message);
        } catch (\Exception $e) {
            Log::error('WhatsAppCredentialService: Error sending password reset', [
                'user_id' => $usuario->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build the credential message
     */
    protected function buildCredentialMessage(Usuario $usuario, string $password, string $empresaNombre, string $loginUrl): string
    {
        return "Bienvenido a {$empresaNombre}!

Tu cuenta ha sido creada exitosamente.

*Credenciales de acceso:*
Usuario: {$usuario->email}
Contrasena: {$password}

*Enlace de acceso:*
{$loginUrl}

Por seguridad, te recomendamos cambiar tu contrasena despues de iniciar sesion.

Saludos,
Equipo {$empresaNombre}";
    }

    /**
     * Build the password reset message
     */
    protected function buildPasswordResetMessage(Usuario $usuario, string $newPassword, string $empresaNombre, string $loginUrl): string
    {
        return "Hola {$usuario->nombre},

Tu contrasena ha sido restablecida en {$empresaNombre}.

*Nuevas credenciales:*
Usuario: {$usuario->email}
Nueva contrasena: {$newPassword}

*Enlace de acceso:*
{$loginUrl}

Por seguridad, te recomendamos cambiar tu contrasena despues de iniciar sesion.

Saludos,
Equipo {$empresaNombre}";
    }
}
