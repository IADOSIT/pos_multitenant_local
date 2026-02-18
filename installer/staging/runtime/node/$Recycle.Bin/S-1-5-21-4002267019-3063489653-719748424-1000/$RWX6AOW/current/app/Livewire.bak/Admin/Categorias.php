<?php

namespace App\Livewire\Admin;

use App\Models\Categoria;
use Livewire\Component;
use Livewire\WithPagination;

class Categorias extends Component
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
    public $orden = 0;
    public $activa = true;

    protected $queryString = ['search', 'filterStatus'];

    protected function rules()
    {
        $empresaId = session('empresa_id');
        return [
            'nombre' => 'required|string|max:160',
            'slug' => [
                'required',
                'string',
                'max:120',
                function ($attribute, $value, $fail) use ($empresaId) {
                    $exists = Categoria::where('empresa_id', $empresaId)
                        ->where('slug', $value)
                        ->when($this->editingId, fn($q) => $q->where('id', '!=', $this->editingId))
                        ->exists();
                    if ($exists) {
                        $fail('Este slug ya existe para esta empresa.');
                    }
                },
            ],
            'orden' => 'integer|min:0',
            'activa' => 'boolean',
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
            $categoria = Categoria::findOrFail($id);
            $this->nombre = $categoria->nombre;
            $this->slug = $categoria->slug;
            $this->orden = $categoria->orden ?? 0;
            $this->activa = $categoria->activa;
        } else {
            $this->reset(['nombre', 'slug', 'orden', 'activa']);
            $this->activa = true;
            $this->orden = Categoria::where('empresa_id', session('empresa_id'))->max('orden') + 1;
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

        $data = [
            'empresa_id' => $empresaId,
            'nombre' => $this->nombre,
            'slug' => $this->slug,
            'orden' => $this->orden,
            'activa' => $this->activa,
        ];

        if ($this->editingId) {
            Categoria::where('id', $this->editingId)->update($data);
            $this->dispatch('toast', type: 'success', message: 'Categoria actualizada correctamente');
        } else {
            Categoria::create($data);
            $this->dispatch('toast', type: 'success', message: 'Categoria creada correctamente');
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
        $categoria = Categoria::find($this->deleteId);
        if ($categoria) {
            // Check if has products
            if ($categoria->productos()->count() > 0) {
                $this->dispatch('toast', type: 'error', message: 'No se puede eliminar: tiene productos asociados');
            } else {
                $categoria->delete();
                $this->dispatch('toast', type: 'success', message: 'Categoria eliminada correctamente');
            }
        }
        $this->showDeleteModal = false;
        $this->deleteId = null;
    }

    public function toggleStatus($id)
    {
        $categoria = Categoria::find($id);
        if ($categoria) {
            $categoria->update(['activa' => !$categoria->activa]);
            $this->dispatch('toast', type: 'success', message: 'Estado actualizado');
        }
    }

    public function render()
    {
        $empresaId = session('empresa_id');
        $query = Categoria::where('empresa_id', $empresaId);

        if ($this->search) {
            $query->where(function($q) {
                $q->where('nombre', 'ilike', '%' . $this->search . '%')
                  ->orWhere('slug', 'ilike', '%' . $this->search . '%');
            });
        }

        if ($this->filterStatus !== '') {
            $query->where('activa', $this->filterStatus === '1');
        }

        $categorias = $query->orderBy('orden')->paginate(10);

        return view('livewire.admin.categorias', [
            'categorias' => $categorias,
        ]);
    }
}
