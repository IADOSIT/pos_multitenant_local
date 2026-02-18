<div class="p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">Productos</h1>
            <p class="text-gray-500">Administra el catalogo de productos</p>
        </div>
        <button wire:click="openModal" class="btn btn-primary gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
        </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
                <input type="text" wire:model.live.debounce.300ms="search"
                    placeholder="Buscar por nombre o SKU..."
                    class="input input-bordered w-full" />
            </div>
            <div class="w-full sm:w-48">
                <select wire:model.live="filterCategoria" class="select select-bordered w-full">
                    <option value="">Todas las categorias</option>
                    @foreach($categorias as $cat)
                        <option value="{{ $cat->id }}">{{ $cat->nombre }}</option>
                    @endforeach
                </select>
            </div>
            <div class="w-full sm:w-40">
                <select wire:model.live="filterStatus" class="select select-bordered w-full">
                    <option value="">Todos</option>
                    <option value="1">Activos</option>
                    <option value="0">Inactivos</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
                <thead>
                    <tr class="bg-gray-50">
                        <th>Imagen</th>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Categoria</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($productos as $producto)
                        <tr wire:key="prod-{{ $producto->id }}">
                            <td>
                                @if($producto->imagen_url)
                                    <img src="{{ $producto->imagen_url }}" alt="{{ $producto->nombre }}"
                                        class="w-12 h-12 object-cover rounded-lg" />
                                @else
                                    <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                @endif
                            </td>
                            <td>
                                <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ $producto->sku }}</code>
                            </td>
                            <td>
                                <div class="font-medium">{{ $producto->nombre }}</div>
                                @if($producto->descripcion)
                                    <div class="text-sm text-gray-500 truncate max-w-xs">{{ Str::limit($producto->descripcion, 50) }}</div>
                                @endif
                            </td>
                            <td>
                                <span class="badge badge-ghost">{{ $producto->categoria?->nombre ?? '-' }}</span>
                            </td>
                            <td class="font-semibold text-primary-600">
                                ${{ number_format($producto->precio, 2) }}
                            </td>
                            <td>
                                <button wire:click="toggleStatus({{ $producto->id }})" class="cursor-pointer">
                                    @if($producto->activo)
                                        <span class="badge badge-success">Activo</span>
                                    @else
                                        <span class="badge badge-error">Inactivo</span>
                                    @endif
                                </button>
                            </td>
                            <td class="text-right">
                                <div class="flex justify-end gap-2">
                                    <button wire:click="openModal({{ $producto->id }})" class="btn btn-sm btn-ghost">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button wire:click="confirmDelete({{ $producto->id }})" class="btn btn-sm btn-ghost text-error">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="text-center py-8 text-gray-500">
                                No se encontraron productos
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($productos->hasPages())
            <div class="px-4 py-3 border-t">
                {{ $productos->links() }}
            </div>
        @endif
    </div>

    <!-- Create/Edit Modal -->
    @if($showModal)
    <div class="modal modal-open">
        <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">
                {{ $editingId ? 'Editar Producto' : 'Nuevo Producto' }}
            </h3>
            <form wire:submit="save">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label"><span class="label-text">SKU *</span></label>
                        <input type="text" wire:model="sku" class="input input-bordered @error('sku') input-error @enderror" />
                        @error('sku') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Categoria *</span></label>
                        <select wire:model="categoria_id" class="select select-bordered @error('categoria_id') select-error @enderror">
                            <option value="">Seleccionar...</option>
                            @foreach($categorias as $cat)
                                <option value="{{ $cat->id }}">{{ $cat->nombre }}</option>
                            @endforeach
                        </select>
                        @error('categoria_id') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control md:col-span-2">
                        <label class="label"><span class="label-text">Nombre *</span></label>
                        <input type="text" wire:model="nombre" class="input input-bordered @error('nombre') input-error @enderror" />
                        @error('nombre') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control md:col-span-2">
                        <label class="label"><span class="label-text">Descripcion</span></label>
                        <textarea wire:model="descripcion" class="textarea textarea-bordered" rows="3"></textarea>
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Precio *</span></label>
                        <input type="number" wire:model="precio" class="input input-bordered @error('precio') input-error @enderror" step="0.01" min="0" />
                        @error('precio') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Imagen</span></label>
                        <input type="file" wire:model="imagen" class="file-input file-input-bordered w-full" accept="image/*" />
                        @error('imagen') <span class="text-error text-sm">{{ $message }}</span> @enderror
                        <div wire:loading wire:target="imagen" class="text-sm text-gray-500 mt-1">Cargando...</div>
                    </div>
                    @if($imagen)
                        <div class="md:col-span-2">
                            <img src="{{ $imagen->temporaryUrl() }}" alt="Preview" class="w-32 h-32 object-cover rounded-lg" />
                        </div>
                    @elseif($imagenPreview)
                        <div class="md:col-span-2">
                            <img src="{{ $imagenPreview }}" alt="Imagen actual" class="w-32 h-32 object-cover rounded-lg" />
                        </div>
                    @endif
                    <div class="form-control md:col-span-2">
                        <label class="label cursor-pointer justify-start gap-3">
                            <input type="checkbox" wire:model="activo" class="checkbox checkbox-primary" />
                            <span class="label-text">Producto activo</span>
                        </label>
                    </div>
                </div>
                <div class="modal-action">
                    <button type="button" wire:click="closeModal" class="btn">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <span wire:loading.remove wire:target="save">Guardar</span>
                        <span wire:loading wire:target="save" class="loading loading-spinner loading-sm"></span>
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" wire:click="closeModal"></div>
    </div>
    @endif

    <!-- Delete Confirmation Modal -->
    @if($showDeleteModal)
    <div class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg">Confirmar eliminacion</h3>
            <p class="py-4">Esta accion eliminara el producto permanentemente.</p>
            <div class="modal-action">
                <button wire:click="$set('showDeleteModal', false)" class="btn">Cancelar</button>
                <button wire:click="delete" class="btn btn-error">Eliminar</button>
            </div>
        </div>
        <div class="modal-backdrop" wire:click="$set('showDeleteModal', false)"></div>
    </div>
    @endif
</div>
