<?php

namespace App\Livewire\Admin;

use App\Models\Empresa;
use App\Models\Usuario;
use Livewire\Component;
use Livewire\WithPagination;

class Empresas extends Component
{
    use WithPagination;

    public $search = '';
    public $filterStatus = '';
    public $showModal = false;
    public $showDeleteModal = false;
    public $editingId = null;
    public $deleteId = null;

    // Form fields
    public $nombre = '';
    public $slug = '';
    public $activa = true;
    public $brand_nombre_publico = '';
    public $brand_color = '#16a34a';
    public $contacto = '';
    public $whatsapp = '';
    public $email = '';

    protected $queryString = ['search', 'filterStatus'];

    protected function rules()
    {
        return [
            'nombre' => 'required|string|max:160',
            'slug' => 'required|string|max:120|unique:empresas,slug,' . $this->editingId,
            'activa' => 'boolean',
            'brand_nombre_publico' => 'nullable|string|max:200',
            'brand_color' => 'nullable|string|max:20',
            'contacto' => 'nullable|string|max:160',
            'whatsapp' => 'nullable|string|max:32',
            'email' => 'nullable|email|max:180',
        ];
    }

    public function updatedSearch()
    {
        $this->resetPage();
    }

    public function updatedFilterStatus()
    {
        $this->resetPage();
    }

    public function updatedNombre($value)
    {
        if (!$this->editingId) {
            $this->slug = \Illuminate\Support\Str::slug($value);
        }
    }

    public function openModal($id = null)
    {
        $this->resetValidation();
        $this->editingId = $id;

        if ($id) {
            $empresa = Empresa::findOrFail($id);
            $this->nombre = $empresa->nombre;
            $this->slug = $empresa->slug;
            $this->activa = $empresa->activa;
            $this->brand_nombre_publico = $empresa->brand_nombre_publico;
            $this->brand_color = $empresa->brand_color ?? '#16a34a';
            $config = $empresa->config ?? [];
            $this->contacto = $config['contacto'] ?? '';
            $this->whatsapp = $config['whatsapp'] ?? '';
            $this->email = $config['email'] ?? '';
        } else {
            $this->reset(['nombre', 'slug', 'activa', 'brand_nombre_publico', 'brand_color', 'contacto', 'whatsapp', 'email']);
            $this->activa = true;
            $this->brand_color = '#16a34a';
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

        $data = [
            'nombre' => $this->nombre,
            'slug' => $this->slug,
            'activa' => $this->activa,
            'brand_nombre_publico' => $this->brand_nombre_publico,
            'brand_color' => $this->brand_color,
            'config' => [
                'contacto' => $this->contacto,
                'whatsapp' => $this->whatsapp,
                'email' => $this->email,
            ],
        ];

        if ($this->editingId) {
            Empresa::where('id', $this->editingId)->update($data);
            $this->dispatch('toast', type: 'success', message: 'Empresa actualizada correctamente');
        } else {
            Empresa::create($data);
            $this->dispatch('toast', type: 'success', message: 'Empresa creada correctamente');
        }

        $this->closeModal();
    }

    public function confirmDelete($id)
    {
        $this->deleteId = $id;
        $this->showDeleteModal = true;
    }

    public function delete()
    {
        $empresa = Empresa::find($this->deleteId);
        if ($empresa) {
            $empresa->update(['activa' => false]);
            $this->dispatch('toast', type: 'success', message: 'Empresa desactivada correctamente');
        }
        $this->showDeleteModal = false;
        $this->deleteId = null;
    }

    public function toggleStatus($id)
    {
        $empresa = Empresa::find($id);
        if ($empresa) {
            $empresa->update(['activa' => !$empresa->activa]);
            $this->dispatch('toast', type: 'success', message: 'Estado actualizado');
        }
    }

    public function render()
    {
        $query = Empresa::query();

        if ($this->search) {
            $query->where(function($q) {
                $q->where('nombre', 'ilike', '%' . $this->search . '%')
                  ->orWhere('slug', 'ilike', '%' . $this->search . '%');
            });
        }

        if ($this->filterStatus !== '') {
            $query->where('activa', $this->filterStatus === '1');
        }

        $empresas = $query->orderBy('nombre')->paginate(10);

        return view('livewire.admin.empresas', [
            'empresas' => $empresas,
        ]);
    }
}
