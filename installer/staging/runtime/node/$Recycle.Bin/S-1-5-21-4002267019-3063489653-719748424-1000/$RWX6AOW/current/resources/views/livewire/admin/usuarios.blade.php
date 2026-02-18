<div class="p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">Usuarios</h1>
            <p class="text-gray-500">Administra los usuarios de la empresa</p>
        </div>
        <div class="flex gap-2">
            <button wire:click="openAttachModal" class="btn btn-outline btn-primary gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Asignar Existente
            </button>
            <button wire:click="openModal" class="btn btn-primary gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Usuario
            </button>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
                <input type="text" wire:model.live.debounce.300ms="search"
                    placeholder="Buscar por nombre o email..."
                    class="input input-bordered w-full" />
            </div>
            <div class="w-full sm:w-48">
                <select wire:model.live="filterRol" class="select select-bordered w-full">
                    <option value="">Todos los roles</option>
                    @foreach($roles as $rol)
                        <option value="{{ $rol->id }}">{{ $rol->nombre }}</option>
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
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>WhatsApp</th>
                        <th>Estado</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($usuarios as $usuario)
                        <tr wire:key="user-{{ $usuario->id }}">
                            <td class="font-medium">{{ $usuario->name }}</td>
                            <td>{{ $usuario->email }}</td>
                            <td>
                                <span class="badge badge-primary">{{ $usuario->rol_nombre }}</span>
                            </td>
                            <td>{{ $usuario->whatsapp ?? '-' }}</td>
                            <td>
                                <button wire:click="toggleStatus({{ $usuario->id }})" class="cursor-pointer">
                                    @if($usuario->pivot_activo)
                                        <span class="badge badge-success">Activo</span>
                                    @else
                                        <span class="badge badge-error">Inactivo</span>
                                    @endif
                                </button>
                            </td>
                            <td class="text-right">
                                <div class="flex justify-end gap-2">
                                    <button wire:click="openModal({{ $usuario->id }})" class="btn btn-sm btn-ghost">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button wire:click="confirmDelete({{ $usuario->id }})" class="btn btn-sm btn-ghost text-error">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="text-center py-8 text-gray-500">
                                No se encontraron usuarios
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($usuarios->hasPages())
            <div class="px-4 py-3 border-t">
                {{ $usuarios->links() }}
            </div>
        @endif
    </div>

    <!-- Create/Edit Modal -->
    @if($showModal)
    <div class="modal modal-open">
        <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">
                {{ $editingId ? 'Editar Usuario' : 'Nuevo Usuario' }}
            </h3>
            <form wire:submit="save">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control md:col-span-2">
                        <label class="label"><span class="label-text">Nombre *</span></label>
                        <input type="text" wire:model="name" class="input input-bordered @error('name') input-error @enderror" />
                        @error('name') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Email *</span></label>
                        <input type="email" wire:model="email" class="input input-bordered @error('email') input-error @enderror" />
                        @error('email') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Contrasena {{ $editingId ? '(dejar vacio para mantener)' : '*' }}</span>
                        </label>
                        <input type="password" wire:model="password" class="input input-bordered @error('password') input-error @enderror" />
                        @error('password') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">WhatsApp</span></label>
                        <input type="text" wire:model="whatsapp" class="input input-bordered" placeholder="528311234567" />
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Telefono</span></label>
                        <input type="text" wire:model="telefono" class="input input-bordered" />
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Rol *</span></label>
                        <select wire:model="rol_id" class="select select-bordered @error('rol_id') select-error @enderror">
                            <option value="">Seleccionar...</option>
                            @foreach($roles as $rol)
                                <option value="{{ $rol->id }}">{{ $rol->nombre }}</option>
                            @endforeach
                        </select>
                        @error('rol_id') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control">
                        <label class="label cursor-pointer justify-start gap-3">
                            <input type="checkbox" wire:model="activo" class="checkbox checkbox-primary" />
                            <span class="label-text">Usuario activo</span>
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

    <!-- Attach Existing User Modal -->
    @if($showAttachModal)
    <div class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">Asignar Usuario Existente</h3>
            <form wire:submit="attachUser">
                <div class="space-y-4">
                    <div class="form-control">
                        <label class="label"><span class="label-text">Email del usuario *</span></label>
                        <input type="email" wire:model="attachEmail" class="input input-bordered @error('attachEmail') input-error @enderror"
                            placeholder="usuario@ejemplo.com" />
                        @error('attachEmail') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">Rol *</span></label>
                        <select wire:model="attachRolId" class="select select-bordered @error('attachRolId') select-error @enderror">
                            <option value="">Seleccionar...</option>
                            @foreach($roles as $rol)
                                <option value="{{ $rol->id }}">{{ $rol->nombre }}</option>
                            @endforeach
                        </select>
                        @error('attachRolId') <span class="text-error text-sm">{{ $message }}</span> @enderror
                    </div>
                </div>
                <div class="modal-action">
                    <button type="button" wire:click="closeAttachModal" class="btn">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <span wire:loading.remove wire:target="attachUser">Asignar</span>
                        <span wire:loading wire:target="attachUser" class="loading loading-spinner loading-sm"></span>
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" wire:click="closeAttachModal"></div>
    </div>
    @endif

    <!-- Delete Confirmation Modal -->
    @if($showDeleteModal)
    <div class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg">Confirmar eliminacion</h3>
            <p class="py-4">Esta accion removera al usuario de esta empresa. El usuario no sera eliminado del sistema.</p>
            <div class="modal-action">
                <button wire:click="$set('showDeleteModal', false)" class="btn">Cancelar</button>
                <button wire:click="delete" class="btn btn-error">Remover</button>
            </div>
        </div>
        <div class="modal-backdrop" wire:click="$set('showDeleteModal', false)"></div>
    </div>
    @endif
</div>
