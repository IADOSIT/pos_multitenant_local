<?php

namespace App\Livewire\Admin;

use App\Models\Usuario;
use App\Models\Rol;
use App\Models\Empresa;
use Livewire\Component;
use Livewire\WithPagination;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class Usuarios extends Component
{
    use WithPagination;

    public $search = '';
    public $filterRol = '';
    public $filterStatus = '';
    public $showModal = false;
    public $showDeleteModal = false;
    public $showAttachModal = false;
    public $editingId = null;
    public $deleteId = null;

    // Form fields for create/edit
    public $name = '';
    public $email = '';
    public $password = '';
    public $whatsapp = '';
    public $telefono = '';
    public $rol_id = '';
    public $activo = true;

    // Attach existing user
    public $attachEmail = '';
    public $attachRolId = '';

    protected $queryString = ['search', 'filterRol', 'filterStatus'];

    protected function rules()
    {
        return [
            'name' => 'required|string|max:160',
            'email' => 'required|email|max:180|unique:usuarios,email,' . $this->editingId,
            'password' => $this->editingId ? 'nullable|min:6' : 'required|min:6',
            'whatsapp' => 'nullable|string|max:32',
            'telefono' => 'nullable|string|max:32',
            'rol_id' => 'required|exists:roles,id',
            'activo' => 'boolean',
        ];
    }

    public function updatedSearch()
    {
        $this->resetPage();
    }

    public function updatedFilterRol()
    {
        $this->resetPage();
    }

    public function updatedFilterStatus()
    {
        $this->resetPage();
    }

    public function openModal($id = null)
    {
        $this->resetValidation();
        $this->editingId = $id;

        if ($id) {
            $usuario = Usuario::findOrFail($id);
            $this->name = $usuario->name;
            $this->email = $usuario->email;
            $this->password = '';
            $this->whatsapp = $usuario->whatsapp;
            $this->telefono = $usuario->telefono;

            // Get role from pivot
            $empresaId = session('empresa_id');
            $pivot = DB::table('empresa_usuario')
                ->where('empresa_id', $empresaId)
                ->where('usuario_id', $id)
                ->first();
            $this->rol_id = $pivot->rol_id ?? '';
            $this->activo = $pivot->activo ?? true;
        } else {
            $this->reset(['name', 'email', 'password', 'whatsapp', 'telefono', 'rol_id', 'activo']);
            $this->activo = true;
        }

        $this->showModal = true;
    }

    public function closeModal()
    {
        $this->showModal = false;
        $this->editingId = null;
        $this->resetValidation();
    }

    public function save()
    {
        $this->validate();

        $empresaId = session('empresa_id');

        $userData = [
            'name' => $this->name,
            'email' => $this->email,
            'whatsapp' => $this->whatsapp,
            'telefono' => $this->telefono,
        ];

        if ($this->password) {
            $userData['password'] = Hash::make($this->password);
        }

        if ($this->editingId) {
            $usuario = Usuario::find($this->editingId);
            $usuario->update($userData);

            // Update pivot
            DB::table('empresa_usuario')
                ->where('empresa_id', $empresaId)
                ->where('usuario_id', $this->editingId)
                ->update([
                    'rol_id' => $this->rol_id,
                    'activo' => $this->activo,
                    'updated_at' => now(),
                ]);

            $this->dispatch('toast', type: 'success', message: 'Usuario actualizado correctamente');
        } else {
            $userData['password'] = Hash::make($this->password);
            $usuario = Usuario::create($userData);

            // Attach to empresa
            DB::table('empresa_usuario')->insert([
                'empresa_id' => $empresaId,
                'usuario_id' => $usuario->id,
                'rol_id' => $this->rol_id,
                'activo' => $this->activo,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->dispatch('toast', type: 'success', message: 'Usuario creado correctamente');
        }

        $this->closeModal();
    }

    public function openAttachModal()
    {
        $this->resetValidation();
        $this->attachEmail = '';
        $this->attachRolId = '';
        $this->showAttachModal = true;
    }

    public function closeAttachModal()
    {
        $this->showAttachModal = false;
        $this->resetValidation();
    }

    public function attachUser()
    {
        $this->validate([
            'attachEmail' => 'required|email|exists:usuarios,email',
            'attachRolId' => 'required|exists:roles,id',
        ], [
            'attachEmail.exists' => 'No existe un usuario con ese email.',
        ]);

        $empresaId = session('empresa_id');
        $usuario = Usuario::where('email', $this->attachEmail)->first();

        // Check if already attached
        $exists = DB::table('empresa_usuario')
            ->where('empresa_id', $empresaId)
            ->where('usuario_id', $usuario->id)
            ->exists();

        if ($exists) {
            $this->addError('attachEmail', 'Este usuario ya esta asignado a esta empresa.');
            return;
        }

        DB::table('empresa_usuario')->insert([
            'empresa_id' => $empresaId,
            'usuario_id' => $usuario->id,
            'rol_id' => $this->attachRolId,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->dispatch('toast', type: 'success', message: 'Usuario asignado correctamente');
        $this->closeAttachModal();
    }

    public function confirmDelete($id)
    {
        $this->deleteId = $id;
        $this->showDeleteModal = true;
    }

    public function delete()
    {
        $empresaId = session('empresa_id');

        // Remove from pivot only (don't delete user)
        DB::table('empresa_usuario')
            ->where('empresa_id', $empresaId)
            ->where('usuario_id', $this->deleteId)
            ->delete();

        $this->dispatch('toast', type: 'success', message: 'Usuario removido de la empresa');
        $this->showDeleteModal = false;
        $this->deleteId = null;
    }

    public function toggleStatus($id)
    {
        $empresaId = session('empresa_id');

        $pivot = DB::table('empresa_usuario')
            ->where('empresa_id', $empresaId)
            ->where('usuario_id', $id)
            ->first();

        if ($pivot) {
            DB::table('empresa_usuario')
                ->where('empresa_id', $empresaId)
                ->where('usuario_id', $id)
                ->update([
                    'activo' => !$pivot->activo,
                    'updated_at' => now(),
                ]);
            $this->dispatch('toast', type: 'success', message: 'Estado actualizado');
        }
    }

    public function render()
    {
        $empresaId = session('empresa_id');
        $isSuperadmin = auth()->user() && $this->isSuperadmin();

        // Get users for this empresa with their role
        $query = Usuario::select('usuarios.*', 'empresa_usuario.rol_id', 'empresa_usuario.activo as pivot_activo', 'roles.nombre as rol_nombre')
            ->join('empresa_usuario', 'usuarios.id', '=', 'empresa_usuario.usuario_id')
            ->join('roles', 'empresa_usuario.rol_id', '=', 'roles.id')
            ->where('empresa_usuario.empresa_id', $empresaId);

        if ($this->search) {
            $query->where(function($q) {
                $q->where('usuarios.name', 'ilike', '%' . $this->search . '%')
                  ->orWhere('usuarios.email', 'ilike', '%' . $this->search . '%');
            });
        }

        if ($this->filterRol !== '') {
            $query->where('empresa_usuario.rol_id', $this->filterRol);
        }

        if ($this->filterStatus !== '') {
            $query->where('empresa_usuario.activo', $this->filterStatus === '1');
        }

        $usuarios = $query->orderBy('usuarios.name')->paginate(10);

        // Get roles - filter based on user role
        if ($isSuperadmin) {
            $roles = Rol::orderBy('nombre')->get();
        } else {
            // Admin empresa can only assign these roles
            $roles = Rol::whereIn('slug', ['operaciones', 'cajero', 'repartidor'])->orderBy('nombre')->get();
        }

        return view('livewire.admin.usuarios', [
            'usuarios' => $usuarios,
            'roles' => $roles,
        ]);
    }

    private function isSuperadmin()
    {
        $user = auth()->user();
        if (!$user) return false;

        return DB::table('empresa_usuario')
            ->join('roles', 'empresa_usuario.rol_id', '=', 'roles.id')
            ->where('empresa_usuario.usuario_id', $user->id)
            ->where('roles.slug', 'superadmin')
            ->exists();
    }
}
