<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\StoreDomain;
use App\Models\Theme;
use App\Services\ThemeResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EmpresasController extends Controller
{
    public function index()
    {
        $empresas = Empresa::orderBy('nombre')->get();
        return view('admin.empresas.index', compact('empresas'));
    }

    public function create()
    {
        $themes = Theme::where('activo', true)->orderBy('nombre')->get();
        return view('admin.empresas.create', compact('themes'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:160',
            'slug' => 'nullable|string|max:120|unique:empresas,slug',
            'brand_nombre_publico' => 'nullable|string|max:200',
            'brand_color' => 'nullable|string|max:20',
            'activa' => 'boolean',
            'theme_id' => 'nullable|exists:themes,id',
            'logo' => 'nullable|image|max:2048',
            'descripcion' => 'nullable|string|max:500',
            'tags' => 'nullable|string|max:200',
            // Settings
            'app_name' => 'nullable|string|max:200',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'accent_color' => 'nullable|string|max:20',
            'mp_access_token' => 'nullable|string|max:500',
            'mp_public_key' => 'nullable|string|max:500',
            'mp_webhook_secret' => 'nullable|string|max:255',
            'default_product_image_url' => 'nullable|string|max:500',
            // Pickup settings
            'hora_atencion_inicio' => 'nullable|date_format:H:i',
            'hora_atencion_fin' => 'nullable|date_format:H:i',
            'pickup_eta_hours' => 'nullable|numeric|min:0|max:72',
            // Fulfillment options
            'enable_pickup' => 'boolean',
            'enable_delivery' => 'boolean',
        ]);

        $slug = $data['slug'] ?? Str::slug($data['nombre']);

        // Generate unique handle for portal (8 random chars)
        $handle = $this->generateUniqueHandle($slug);

        // Generate public_id (8 random chars)
        $publicId = Str::random(8);

        $logoPath = null;

        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('empresas/logos', 'public');
        }

        $settings = [
            'app_name' => $data['app_name'] ?? null,
            'primary_color' => $data['primary_color'] ?? null,
            'secondary_color' => $data['secondary_color'] ?? null,
            'accent_color' => $data['accent_color'] ?? null,
            'mp_access_token' => $data['mp_access_token'] ?? null,
            'mp_public_key' => $data['mp_public_key'] ?? null,
            'mp_webhook_secret' => $data['mp_webhook_secret'] ?? null,
            'default_product_image_url' => $data['default_product_image_url'] ?? null,
        ];

        // Parse tags from comma-separated string
        $tags = [];
        if (!empty($data['tags'])) {
            $tags = array_map('trim', explode(',', $data['tags']));
            $tags = array_filter($tags);
        }

        $empresa = Empresa::create([
            'nombre' => $data['nombre'],
            'slug' => $slug,
            'handle' => $handle,
            'public_id' => $publicId,
            'brand_nombre_publico' => $data['brand_nombre_publico'] ?? null,
            'brand_color' => $data['brand_color'] ?? null,
            'logo_path' => $logoPath,
            'activa' => $data['activa'] ?? true,
            'theme_id' => $data['theme_id'] ?? null,
            'settings' => array_filter($settings),
            'descripcion' => $data['descripcion'] ?? null,
            'tags' => !empty($tags) ? $tags : null,
            'hora_atencion_inicio' => $data['hora_atencion_inicio'] ?? '08:00',
            'hora_atencion_fin' => $data['hora_atencion_fin'] ?? '18:00',
            'pickup_eta_hours' => $data['pickup_eta_hours'] ?? 2.0,
            'enable_pickup' => $data['enable_pickup'] ?? true,
            'enable_delivery' => $data['enable_delivery'] ?? true,
        ]);

        // Auto-create store_domain with path t/{handle}
        $this->ensureStoreDomain($empresa);

        // Auto-assign all superadmin users to the new empresa
        $this->assignSuperadminsToEmpresa($empresa);

        return redirect()->route('admin.empresas.index')->with('ok', 'Empresa creada correctamente');
    }

    public function edit(int $id)
    {
        $empresa = Empresa::findOrFail($id);
        $themes = Theme::where('activo', true)->orderBy('nombre')->get();
        return view('admin.empresas.edit', compact('empresa', 'themes'));
    }

    public function update(Request $request, int $id)
    {
        $empresa = Empresa::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:160',
            'slug' => 'nullable|string|max:120|unique:empresas,slug,' . $id,
            'handle' => 'nullable|string|max:120|unique:empresas,handle,' . $id,
            'brand_nombre_publico' => 'nullable|string|max:200',
            'brand_color' => 'nullable|string|max:20',
            'support_email' => 'nullable|email|max:200',
            'activa' => 'boolean',
            'theme_id' => 'nullable|exists:themes,id',
            'logo' => 'nullable|image|max:2048',
            'remove_logo' => 'boolean',
            'descripcion' => 'nullable|string|max:500',
            'tags' => 'nullable|string|max:200',
            'is_featured' => 'boolean',
            // Settings
            'app_name' => 'nullable|string|max:200',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'accent_color' => 'nullable|string|max:20',
            'mp_access_token' => 'nullable|string|max:500',
            'mp_public_key' => 'nullable|string|max:500',
            'mp_webhook_secret' => 'nullable|string|max:255',
            'default_product_image_url' => 'nullable|string|max:500',
            // Pickup settings
            'hora_atencion_inicio' => 'nullable|date_format:H:i',
            'hora_atencion_fin' => 'nullable|date_format:H:i',
            'pickup_eta_hours' => 'nullable|numeric|min:0|max:72',
            // Fulfillment options
            'enable_pickup' => 'boolean',
            'enable_delivery' => 'boolean',
        ]);

        // Handle logo
        $logoPath = $empresa->logo_path;
        if ($request->boolean('remove_logo') && $logoPath) {
            Storage::disk('public')->delete($logoPath);
            $logoPath = null;
        }
        if ($request->hasFile('logo')) {
            if ($empresa->logo_path) {
                Storage::disk('public')->delete($empresa->logo_path);
            }
            $logoPath = $request->file('logo')->store('empresas/logos', 'public');
        }

        $settings = array_merge($empresa->settings ?? [], [
            'app_name' => $data['app_name'] ?? null,
            'primary_color' => $data['primary_color'] ?? null,
            'secondary_color' => $data['secondary_color'] ?? null,
            'accent_color' => $data['accent_color'] ?? null,
            'mp_access_token' => $data['mp_access_token'] ?? null,
            'mp_public_key' => $data['mp_public_key'] ?? null,
            'mp_webhook_secret' => $data['mp_webhook_secret'] ?? null,
            'default_product_image_url' => $data['default_product_image_url'] ?? null,
        ]);

        // Parse tags from comma-separated string
        $tags = [];
        if (!empty($data['tags'])) {
            $tags = array_map('trim', explode(',', $data['tags']));
            $tags = array_filter($tags);
        }

        // Generate handle if not exists
        $handle = $data['handle'] ?? $empresa->handle;
        if (empty($handle)) {
            $handle = $this->generateUniqueHandle($data['slug'] ?? $empresa->slug ?? Str::slug($data['nombre']));
        }

        // Generate public_id if not exists
        $publicId = $empresa->public_id;
        if (empty($publicId)) {
            $publicId = Str::random(8);
        }

        $empresa->update([
            'nombre' => $data['nombre'],
            'slug' => $data['slug'] ?? $empresa->slug,
            'handle' => $handle,
            'public_id' => $publicId,
            'brand_nombre_publico' => $data['brand_nombre_publico'] ?? null,
            'brand_color' => $data['brand_color'] ?? null,
            'support_email' => $data['support_email'] ?? null,
            'logo_path' => $logoPath,
            'activa' => $data['activa'] ?? true,
            'theme_id' => $data['theme_id'] ?? null,
            'settings' => array_filter($settings),
            'descripcion' => $data['descripcion'] ?? null,
            'tags' => !empty($tags) ? $tags : null,
            'is_featured' => $request->boolean('is_featured'),
            'hora_atencion_inicio' => $data['hora_atencion_inicio'] ?? $empresa->hora_atencion_inicio ?? '08:00',
            'hora_atencion_fin' => $data['hora_atencion_fin'] ?? $empresa->hora_atencion_fin ?? '18:00',
            'pickup_eta_hours' => $data['pickup_eta_hours'] ?? $empresa->pickup_eta_hours ?? 2.0,
            'enable_pickup' => $request->boolean('enable_pickup'),
            'enable_delivery' => $request->boolean('enable_delivery'),
        ]);

        // Sync store_domain if handle changed
        $this->ensureStoreDomain($empresa);

        // Clear theme cache so changes apply immediately
        ThemeResolver::clearCache($empresa->id);

        return redirect()->route('admin.empresas.index')->with('ok', 'Empresa actualizada correctamente');
    }

    public function destroy(int $id)
    {
        $empresa = Empresa::findOrFail($id);

        // Check if empresa has related data
        if ($empresa->ordenes()->exists() || $empresa->productos()->exists()) {
            return back()->with('error', 'No se puede eliminar una empresa con ordenes o productos');
        }

        if ($empresa->logo_path) {
            Storage::disk('public')->delete($empresa->logo_path);
        }

        $empresa->delete();

        return redirect()->route('admin.empresas.index')->with('ok', 'Empresa eliminada correctamente');
    }

    /**
     * Generate a unique handle for the empresa
     */
    private function generateUniqueHandle(string $baseSlug): string
    {
        $handle = Str::slug($baseSlug);
        $suffix = '';
        $counter = 1;

        while (Empresa::where('handle', $handle . $suffix)->exists()) {
            $suffix = '-' . $counter;
            $counter++;
        }

        return $handle . $suffix;
    }

    /**
     * Auto-assign all superadmin users to a newly created empresa.
     */
    private function assignSuperadminsToEmpresa(Empresa $empresa): void
    {
        // Find the superadmin role ID
        $superadminRolId = DB::table('roles')->where('slug', 'superadmin')->value('id');
        if (!$superadminRolId) return;

        // Find all users that have superadmin role in any empresa
        $superadminUserIds = DB::table('empresa_usuario')
            ->where('rol_id', $superadminRolId)
            ->distinct()
            ->pluck('usuario_id');

        // Check which ones are already assigned to this empresa
        $existingUserIds = DB::table('empresa_usuario')
            ->where('empresa_id', $empresa->id)
            ->pluck('usuario_id');

        $missing = $superadminUserIds->diff($existingUserIds);

        foreach ($missing as $userId) {
            DB::table('empresa_usuario')->insert([
                'empresa_id' => $empresa->id,
                'usuario_id' => $userId,
                'rol_id' => $superadminRolId,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Ensure empresa has a store_domain entry with path t/{handle}
     */
    private function ensureStoreDomain(Empresa $empresa): void
    {
        $storePath = 't/' . $empresa->handle;

        // Check if primary domain exists
        $primaryDomain = $empresa->domains()->where('is_primary', true)->first();

        if ($primaryDomain) {
            // Update existing primary domain if handle changed
            if ($primaryDomain->domain !== $storePath) {
                StoreDomain::clearCache($primaryDomain->domain);
                $primaryDomain->update(['domain' => $storePath]);
            }
        } else {
            // Create new primary store_domain
            StoreDomain::create([
                'empresa_id' => $empresa->id,
                'domain' => $storePath,
                'is_primary' => true,
                'is_active' => true,
                'ssl_enabled' => true,
            ]);
        }
    }
}
