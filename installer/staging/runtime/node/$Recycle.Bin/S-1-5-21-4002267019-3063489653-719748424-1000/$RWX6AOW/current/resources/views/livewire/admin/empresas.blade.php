<div class="p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">Empresas</h1>
            <p class="text-gray-500">Administra las empresas del sistema</p>
        </div>
        <button wire:click="openModal" class="btn btn-primary gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Empresa
        </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
                <input type="text" wire:model.live.debounce.300ms="search"
                    placeholder="Buscar por nombre o slug..."
                    class="input input-bordered w-full" />
            </div>
            <div class="w-full sm:w-48">
                <select wire:model.live="filterStatus" class="select select-bordered w-full">
                    <option value="">Todos los estados</option>
                    <option value="1">Activas</option>
                    <option value="0">Inactivas</option>
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
                        <th>Nombre</th>
                        <th>Slug</th>
                        <th>Color</th>
                        <th>Estado</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($empresas as $empresa)
                        <tr wire:key="empresa-{{ $empresa->id }}">
                            <td>
                                <div class="font-medium">{{ $empresa->nombre }}</div>
                                @if($empresa->brand_nombre_publico)
                                    <div class="text-sm text-gray-500">{{ $empresa->brand_nombre_publico }}</div>
                                @endif
                            </td>
                            <td>
                                <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ $empresa->slug }}</code>
                            </td>
                            <td>
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 rounded-full border" style="background-color: {{ $empresa->brand_color ?? '#16a34a' }}"></div>
                                    <span class="text-sm text-gray-600">{{ $empresa->brand_color ?? '#16a34a' }}</span>
                                </div>
                            </td>
                            <td>
                                <button wire:click="toggleStatus({{ $empresa->id }})" class="cursor-pointer">
                                    @if($empresa->activa)
                                        <span class="badge badge-success">Activa</span>
                                    @else
                                        <span class="badge badge-error">Inactiva</span>
                                    @endif
                                </button>
                            </td>
                            <td class="text-right">
                                <div class="flex justify-end gap-2">
                                    <button wire:click="openModal({{ $empresa->id }})" class="btn btn-sm btn-ghost">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button wire:click="confirmDelete({{ $empresa->id }})" class="btn btn-sm btn-ghost text-error">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center py-8 text-gray-500">
                                No se encontraron empresas
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($empresas->hasPages())
            <div class="px-4 py-3 border-t">
                {{ $empresas->links() }}
            </div>
        @endif
    </div>

    <!-- Create/Edit Modal -->
    @if($showModal)
    <div class="modal modal-open">
        <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">
                {{ $editingId ? 'Editar Empresa' : 'Nueva Empresa' }}
            </h3>
            <form wire:submit="save">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label"><span class="label-text">Nombre *</span></label>
                        <input type="text" wire:model.live="nombre" class="input input-bordered @error('nombre') input-error @enderror" />
                        @error('nombre') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Slug *</span></label>
                        <input type="text" wire:model="slug" class="input input-bordered @error('slug') input-error @enderror" />
                        @error('slug') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Nombre Publico</span></label>
                        <input type="text" wire:model="brand_nombre_publico" class="input input-bordered" />
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Color de Marca</span></label>
                        <input type="color" wire:model="brand_color" class="input input-bordered h-12 p-1" />
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Contacto</span></label>
                        <input type="text" wire:model="contacto" class="input input-bordered" />
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">WhatsApp</span></label>
                        <input type="text" wire:model="whatsapp" class="input input-bordered" placeholder="528311234567" />
                    </div>
                    <div class="form-control md:col-span-2">
                        <label class="label"><span class="label-text">Email</span></label>
                        <input type="email" wire:model="email" class="input input-bordered" />
                        @error('email') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control md:col-span-2">
                        <label class="label cursor-pointer justify-start gap-3">
                            <input type="checkbox" wire:model="activa" class="checkbox checkbox-primary" />
                            <span class="label-text">Empresa activa</span>
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
            <h3 class="font-bold text-lg">Confirmar desactivacion</h3>
            <p class="py-4">Esta accion desactivara la empresa. Los datos no se eliminaran.</p>
            <div class="modal-action">
                <button wire:click="$set('showDeleteModal', false)" class="btn">Cancelar</button>
                <button wire:click="delete" class="btn btn-error">Desactivar</button>
            </div>
        </div>
        <div class="modal-backdrop" wire:click="$set('showDeleteModal', false)"></div>
    </div>
    @endif
</div>
