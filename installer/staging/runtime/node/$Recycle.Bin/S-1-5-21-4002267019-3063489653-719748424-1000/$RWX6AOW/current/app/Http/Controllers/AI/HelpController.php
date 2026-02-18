<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\AIHelpLog;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HelpController extends Controller
{
    private array $systemModules = [
        'productos' => [
            'name' => 'Productos',
            'routes' => ['admin.productos.index', 'admin.productos.create'],
            'description' => 'Gestión de catálogo de productos',
            'roles' => ['admin_empresa', 'superadmin'],
        ],
        'categorias' => [
            'name' => 'Categorías',
            'routes' => ['admin.categorias.index', 'admin.categorias.create'],
            'description' => 'Organización de productos por categorías',
            'roles' => ['admin_empresa', 'superadmin'],
        ],
        'inventarios' => [
            'name' => 'Inventario',
            'routes' => ['admin.inventarios.index'],
            'description' => 'Control de stock y kardex',
            'roles' => ['admin_empresa', 'superadmin'],
        ],
        'caja' => [
            'name' => 'Caja',
            'routes' => ['admin.caja.index'],
            'description' => 'Turnos y movimientos de caja',
            'roles' => ['admin_empresa', 'superadmin', 'operaciones'],
        ],
        'clientes' => [
            'name' => 'Clientes',
            'routes' => ['admin.clientes.index'],
            'description' => 'Base de datos de clientes',
            'roles' => ['admin_empresa', 'superadmin'],
        ],
        'ordenes' => [
            'name' => 'Órdenes',
            'routes' => ['ops.ordenes.index', 'ops.ordenes.hoy'],
            'description' => 'Gestión de pedidos y órdenes',
            'roles' => ['admin_empresa', 'superadmin', 'operaciones'],
        ],
        'whatsapp' => [
            'name' => 'WhatsApp',
            'routes' => ['admin.whatsapp.index'],
            'description' => 'Notificaciones por WhatsApp',
            'roles' => ['admin_empresa', 'superadmin'],
        ],
        'pagos' => [
            'name' => 'Pagos',
            'routes' => ['admin.pagos.index'],
            'description' => 'Gestión de pagos y MercadoPago',
            'roles' => ['admin_empresa', 'superadmin'],
        ],
    ];

    public function index()
    {
        return view('admin.ai.help');
    }

    public function ask(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $userId = auth()->id();

        $data = $request->validate([
            'pregunta' => 'required|string|max:1000',
        ]);

        $apiKey = config('services.openai.key') ?? env('AI_API_KEY');
        $provider = config('services.ai.provider') ?? env('AI_PROVIDER', 'openai');

        if (!$apiKey) {
            return response()->json([
                'error' => true,
                'message' => 'El asistente IA no está configurado. Contacta al administrador.',
            ]);
        }

        try {
            $context = $this->buildContext($empresaId, $userId);
            $response = $this->callAI($apiKey, $provider, $data['pregunta'], $context);

            // Log the interaction
            AIHelpLog::create([
                'empresa_id' => $empresaId,
                'usuario_id' => $userId,
                'pregunta' => $data['pregunta'],
                'respuesta' => $response['answer'],
                'modelo' => $response['model'] ?? 'unknown',
                'tokens_input' => $response['tokens_input'] ?? null,
                'tokens_output' => $response['tokens_output'] ?? null,
                'meta' => [
                    'context_modules' => array_keys($context['modules']),
                ],
            ]);

            return response()->json([
                'error' => false,
                'respuesta' => $response['answer'],
                'links' => $response['links'] ?? [],
            ]);
        } catch (\Exception $e) {
            Log::error('AI Help error', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => true,
                'message' => 'Error al procesar tu pregunta. Intenta de nuevo.',
            ]);
        }
    }

    private function buildContext(int $empresaId, int $userId): array
    {
        $empresa = Empresa::find($empresaId);
        $user = auth()->user();
        $userRole = $user->getRolForEmpresa($empresaId);

        // Filter modules by user role
        $availableModules = [];
        foreach ($this->systemModules as $key => $module) {
            if ($userRole && in_array($userRole->slug, $module['roles'])) {
                $availableModules[$key] = $module;
            }
        }

        return [
            'empresa' => $empresa ? $empresa->getAppName() : 'Sistema',
            'user_role' => $userRole ? $userRole->nombre : 'Usuario',
            'modules' => $availableModules,
        ];
    }

    private function callAI(string $apiKey, string $provider, string $question, array $context): array
    {
        $systemPrompt = $this->buildSystemPrompt($context);

        if ($provider === 'openai') {
            return $this->callOpenAI($apiKey, $systemPrompt, $question);
        }

        // Default to simple response if no provider configured
        return $this->generateLocalResponse($question, $context);
    }

    private function buildSystemPrompt(array $context): string
    {
        $modules = collect($context['modules'])->map(function ($m, $key) {
            return "- {$m['name']}: {$m['description']}";
        })->implode("\n");

        return <<<PROMPT
Eres el asistente de ayuda del sistema EMC Abastos, una plataforma de gestión para negocios.

Información del usuario:
- Empresa: {$context['empresa']}
- Rol: {$context['user_role']}

Módulos disponibles para este usuario:
{$modules}

Instrucciones:
1. Responde en español de manera clara y concisa
2. Solo sugiere acciones que el usuario puede realizar según su rol
3. Proporciona pasos específicos para completar tareas
4. Si no conoces la respuesta, indica que pueden contactar soporte
5. Incluye rutas o secciones del sistema cuando sea relevante
6. Mantén las respuestas cortas pero informativas
PROMPT;
    }

    private function callOpenAI(string $apiKey, string $systemPrompt, string $question): array
    {
        $response = Http::withToken($apiKey)
            ->timeout(30)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $question],
                ],
                'max_tokens' => 500,
                'temperature' => 0.7,
            ]);

        if (!$response->successful()) {
            throw new \Exception('OpenAI API error: ' . $response->body());
        }

        $data = $response->json();

        return [
            'answer' => $data['choices'][0]['message']['content'] ?? 'Sin respuesta',
            'model' => $data['model'] ?? 'gpt-3.5-turbo',
            'tokens_input' => $data['usage']['prompt_tokens'] ?? null,
            'tokens_output' => $data['usage']['completion_tokens'] ?? null,
        ];
    }

    private function generateLocalResponse(string $question, array $context): array
    {
        $question = strtolower($question);
        $answer = "Lo siento, no tengo una respuesta específica para tu pregunta. ";

        // Simple keyword matching
        if (str_contains($question, 'producto')) {
            $answer = "Para gestionar productos, ve a la sección Productos en el menú lateral. Ahí puedes crear, editar y eliminar productos del catálogo.";
        } elseif (str_contains($question, 'pago') || str_contains($question, 'cobr')) {
            $answer = "Los pagos se gestionan en la sección Pagos. Para configurar MercadoPago, un superadmin debe ingresar las credenciales en la configuración de la empresa.";
        } elseif (str_contains($question, 'inventario') || str_contains($question, 'stock')) {
            $answer = "El inventario se gestiona en la sección Inventario. Puedes ver el kardex de cada producto y hacer ajustes de stock.";
        } elseif (str_contains($question, 'caja') || str_contains($question, 'turno')) {
            $answer = "Para usar la caja, ve a la sección Caja y abre un turno. Registra los movimientos de efectivo, tarjeta o transferencia durante el día.";
        } elseif (str_contains($question, 'orden') || str_contains($question, 'pedido')) {
            $answer = "Las órdenes se gestionan en Operaciones > Órdenes del día. Puedes ver, actualizar estados y enviar notificaciones por WhatsApp.";
        } elseif (str_contains($question, 'cliente')) {
            $answer = "Los clientes se registran automáticamente al hacer pedidos. Puedes verlos y editarlos en la sección Clientes.";
        } elseif (str_contains($question, 'whatsapp')) {
            $answer = "Configura los números de WhatsApp en Admin > WhatsApp. Las notificaciones se envían automáticamente cuando cambia el estado de una orden.";
        }

        return [
            'answer' => $answer,
            'model' => 'local',
            'links' => [],
        ];
    }
}
