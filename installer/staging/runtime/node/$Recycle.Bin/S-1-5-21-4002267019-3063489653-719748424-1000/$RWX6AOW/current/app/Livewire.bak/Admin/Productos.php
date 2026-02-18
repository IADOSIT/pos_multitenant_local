<?php

namespace App\Livewire\Admin;

use App\Models\Producto;
use App\Models\Categoria;
use Livewire\Component;
use Livewire\WithPagination;
use Livewire\WithFileUploads;
use Illuminate\Support\Facades\Storage;

class Productos extends Component
{
    use WithPagination, WithFileUploads;

    public $search = '';
    public $filterStatus = '';
    public $filterCategoria = '';
    public $showModal = false;
    public $showDeleteModal = false;
    public $editingId = null;
    public $deleteId = null;

    // Form fields
    public $sku = '';
    public $nombre = '';
    public $descripcion = '';
    public $precio = 0;
    public $categoria_id = '';
    public $activo = true;
    public $imagen;
    public $imagenPreview = null;

    protected $queryString = ['search', 'filterStatus', 'filterCategoria'];

    protected function rules()
    {
        $empresaId = session('empresa_id');
        return [
            'sku' => [
                'required',
                'string',
                'max:60',
                function ($attribute, $value, $fail) use ($empresaId) {
                    $exists = Producto::where('empresa_id', $empresaId)
                        ->where('sku', $value)
                        ->when($this->editingId, fn($q) => $q->where('id', '!=', $this->editingId))
                        ->exists();
                    if ($exists) {
                        $fail('Este SKU ya existe para esta empresa.');
                    }
                },
            ],
            'nombre' => 'required|string|max:200',
            'descripcion' => 'nullable|string|max:2000',
            'precio' => 'required|numeric|min:0',
            'categoria_id' => [
                'required',
                'exists:categorias,id',
                function ($attribute, $value, $fail) use ($empresaId) {
                    $categoria = Categoria::find($value);
                    if ($categoria && $categoria->empresa_id != $empresaId) {
                        $fail('La categoria no pertenece a esta empresa.');
                    }
                },
            ],
            'activo' => 'boolean',
            'imagen' => 'nullable|image|max:2048',
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

    public function updatedFilterCategoria()
    {
        $this->resetPage();
    }

    public function updatedImagen()
    {
        $this->validateOnly('imagen');
    }

    public function openModal($id = null)
    {
        $this->resetValidation();
        $this->editingId = $id;
        $this->imagen = null;

        if ($id) {
            $producto = Producto::findOrFail($id);
            $this->sku = $producto->sku;
            $this->nombre = $producto->nombre;
            $this->descripcion = $producto->descripcion;
            $this->precio = $producto->precio;
            $this->categoria_id = $producto->categoria_id;
            $this->activo = $producto->activo;
            $this->imagenPreview = $producto->imagen_url;
        } else {
            $this->reset(['sku', 'nombre', 'descripcion', 'precio', 'categoria_id', 'activo', 'imagenPreview']);
            $this->activo = true;
            $this->precio = 0;
        }

        $this->showModal = true;
    }

    public function closeModal()
    {
        $this->showModal = false;
        $this->editingId = null;
        $this->imagen = null;
        $this->imagenPreview = null;
        $this->resetValidation();
    }

    public function save()
    {
        $this->validate();

        $empresaId = session('empresa_id');
        $imagenUrl = $this->imagenPreview;

        if ($this->imagen) {
            $path = $this->imagen->store("productos/{$empresaId}", 'public');
            $imagenUrl = Storage::url($path);
        }

        $data = [
            'empresa_id' => $empresaId,
            'sku' => $this->sku,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'precio' => $this->precio,
            'categoria_id' => $this->categoria_id,
            'activo' => $this->activo,
            'meta' => ['imagen_url' => $imagenUrl],
        ];

        if ($this->editingId) {
            Producto::where('id', $this->editingId)->update($data);
            $this->dispatch('toast', type: 'success', message: 'Producto actualizado correctamente');
        } else {
            Producto::create($data);
            $this->dispatch('toast', type: 'success', message: 'Producto creado correctamente');
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
        $producto = Producto::find($this->deleteId);
        if ($producto) {
            $producto->delete();
            $this->dispatch('toast', type: 'success', message: 'Producto eliminado correctamente');
        }
        $this->showDeleteModal = false;
        $this->deleteId = null;
    }

    public function toggleStatus($id)
    {
        $producto = Producto::find($id);
        if ($producto) {
            $producto->update(['activo' => !$producto->activo]);
            $this->dispatch('toast', type: 'success', message: 'Estado actualizado');
        }
    }

    public function render()
    {
        $empresaId = session('empresa_id');
        $query = Producto::where('empresa_id', $empresaId)->with('categoria');

        if ($this->search) {
            $query->where(function($q) {
                $q->where('nombre', 'ilike', '%' . $this->search . '%')
                  ->orWhere('sku', 'ilike', '%' . $this->search . '%');
            });
        }

        if ($this->filterStatus !== '') {
            $query->where('activo', $this->filterStatus === '1');
        }

        if ($this->filterCategoria !== '') {
            $query->where('categoria_id', $this->filterCategoria);
        }

        $productos = $query->orderBy('nombre')->paginate(10);
        $categorias = Categoria::where('empresa_id', $empresaId)->where('activa', true)->orderBy('nombre')->get();

        return view('livewire.admin.productos', [
            'productos' => $productos,
            'categorias' => $categorias,
        ]);
    }
}
