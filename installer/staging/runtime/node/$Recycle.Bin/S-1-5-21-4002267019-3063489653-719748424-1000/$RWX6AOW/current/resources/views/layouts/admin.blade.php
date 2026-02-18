@php
    $empresaId = session('empresa_id');
    $empresa = $empresaId ? \App\Models\Empresa::find($empresaId) : null;
    $appName = $empresa ? $empresa->getAppName() : 'Mercado De Abastos';
    $logoUrl = $empresa ? $empresa->getLogoUrl() : asset('storage/brand/logo-iados.png');
    $isSuperAdmin = auth()->user()?->isSuperAdmin() ?? false;

    // Get user's empresas for switcher
    $userEmpresas = collect();
    if (auth()->check()) {
        if ($isSuperAdmin) {
            $userEmpresas = \App\Models\Empresa::where('activa', true)->orderBy('nombre')->get();
        } else {
            $userEmpresas = auth()->user()->empresas()
                ->where('empresas.activa', true)
                ->wherePivot('activo', true)
                ->orderBy('empresas.nombre')
                ->get();
        }
    }
    // Debug: si no hay empresas, usar la empresa actual de sesión
    if ($userEmpresas->isEmpty() && $empresa) {
        $userEmpresas = collect([$empresa]);
    }
@endphp
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Admin' }} - {{ $appName }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d' },
                        secondary: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' }
                    }
                }
            }
        }
    </script>
    <style>[x-cloak] { display: none !important; }</style>
</head>
<body class="min-h-screen bg-gray-50">
    <div class="flex min-h-screen" x-data="{ sidebarOpen: true, mobileMenuOpen: false, empresaSwitcher: false }">
        <!-- Mobile sidebar overlay -->
        <div x-show="mobileMenuOpen" x-cloak @click="mobileMenuOpen = false"
             class="fixed inset-0 bg-black/50 z-40 lg:hidden"></div>

        <!-- Sidebar - Always visible, never disappears -->
        <aside class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-800 to-primary-900 text-white flex-shrink-0 transition-all duration-300 transform flex flex-col"
               :class="{ 'lg:w-64': sidebarOpen, 'lg:w-20': !sidebarOpen, '-translate-x-full lg:translate-x-0': !mobileMenuOpen }">
            <div class="p-4 border-b border-primary-700/50">
                <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3">
                    @if($logoUrl)
                        <img src="{{ $logoUrl }}" alt="{{ $appName }}" class="w-10 h-10 rounded-lg object-cover flex-shrink-0">
                    @else
                        <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                        </div>
                    @endif
                    <span class="text-lg font-bold truncate" x-show="sidebarOpen">{{ Str::limit($appName, 18) }}</span>
                </a>
                <div class="text-xs text-primary-200 mt-2 truncate" x-show="sidebarOpen">{{ session('empresa_nombre') ?? '—' }}</div>
            </div>

            <nav class="p-3 space-y-1 text-sm overflow-y-auto flex-1">
                <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.dashboard') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    <span x-show="sidebarOpen">Dashboard</span>
                </a>

                <a href="{{ route('admin.productos.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.productos.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <span x-show="sidebarOpen">Productos</span>
                </a>

                <a href="{{ route('admin.categorias.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.categorias.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                    <span x-show="sidebarOpen">Categorias</span>
                </a>

                <a href="{{ route('admin.inventarios.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.inventarios.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                    </svg>
                    <span x-show="sidebarOpen">Inventario</span>
                </a>

                <a href="{{ route('admin.caja.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.caja.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <span x-show="sidebarOpen">Caja</span>
                </a>

                <a href="{{ route('admin.pagos.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.pagos.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                    <span x-show="sidebarOpen">Pagos</span>
                </a>

                <a href="{{ route('admin.clientes.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.clientes.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                    <span x-show="sidebarOpen">Clientes</span>
                </a>

                <a href="{{ route('admin.whatsapp.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.whatsapp.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span x-show="sidebarOpen">WhatsApp</span>
                </a>

                <a href="{{ route('admin.import-export.hub') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.import-export.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    <span x-show="sidebarOpen">Importar Catalogos</span>
                </a>

                <a href="{{ route('admin.usuarios.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.usuarios.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <span x-show="sidebarOpen">Usuarios</span>
                </a>

                @if($isSuperAdmin)
                <div class="border-t border-primary-700/50 my-3 pt-2" x-show="sidebarOpen">
                    <span class="px-3 text-xs text-primary-300 uppercase tracking-wider">Superadmin</span>
                </div>

                <a href="{{ route('admin.empresas.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.empresas.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <span x-show="sidebarOpen">Empresas</span>
                </a>

                <a href="{{ route('admin.temas.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.temas.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                    </svg>
                    <span x-show="sidebarOpen">Temas</span>
                </a>

                <a href="{{ route('admin.portal.config') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.portal.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                    </svg>
                    <span x-show="sidebarOpen">Portal Central</span>
                </a>
                @endif

                <a href="{{ route('admin.promotions.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.promotions.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                    <span x-show="sidebarOpen">Promociones</span>
                </a>

                <div class="border-t border-primary-700/50 my-3"></div>

                <a href="{{ route('ops.ordenes.hoy') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('ops.ordenes.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <span x-show="sidebarOpen">Ordenes del dia</span>
                </a>

                <a href="{{ route('ops.hub') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('ops.hub') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    <span x-show="sidebarOpen">Operaciones</span>
                </a>

                <div class="border-t border-primary-700/50 my-3"></div>

                <a href="{{ route('admin.ai.help') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition {{ request()->routeIs('admin.ai.*') ? 'bg-white/20 text-white' : 'text-primary-100 hover:bg-white/10' }}">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                    <span x-show="sidebarOpen">Asistente IA</span>
                </a>

                <!-- Ver Tienda -->
                @if($userEmpresas->count() > 1)
                    {{-- Multiple tiendas: show dropdown --}}
                    <div class="relative" x-data="{ showTiendas: false }">
                        <button @click="showTiendas = !showTiendas" type="button"
                                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-primary-200 hover:bg-white/10 hover:text-white">
                            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                            <span x-show="sidebarOpen" class="flex-1 text-left">Ver tienda</span>
                            <span x-show="sidebarOpen" class="text-xs bg-white/20 px-1.5 py-0.5 rounded">{{ $userEmpresas->count() }}</span>
                        </button>
                        <div x-show="showTiendas" x-cloak
                             @click.outside="showTiendas = false"
                             class="absolute left-0 right-0 mt-1 bg-primary-950 border border-primary-700 rounded-lg shadow-lg z-50 overflow-hidden">
                            @foreach($userEmpresas as $t)
                                <a href="/t/{{ $t->handle ?? $t->slug }}"
                                   target="_blank"
                                   class="block px-4 py-2.5 text-sm text-primary-100 hover:bg-primary-800 hover:text-white border-b border-primary-800 last:border-0">
                                    {{ $t->nombre }}
                                </a>
                            @endforeach
                        </div>
                    </div>
                @else
                    {{-- Single or no tienda: direct link --}}
                    @php
                        $singleTienda = $userEmpresas->first();
                        $tiendaHref = $singleTienda && $singleTienda->handle ? '/t/' . $singleTienda->handle : '/';
                    @endphp
                    <a href="{{ $tiendaHref }}" target="_blank"
                       class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-primary-200 hover:bg-white/10 hover:text-white">
                        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        <span x-show="sidebarOpen">Ver tienda</span>
                    </a>
                @endif
            </nav>

            <div class="p-3 mt-auto border-t border-primary-700/50">
                <button @click="sidebarOpen = !sidebarOpen" class="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-primary-200 hover:bg-white/10 transition">
                    <svg class="w-5 h-5 transition-transform" :class="{ 'rotate-180': !sidebarOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
                    </svg>
                </button>
            </div>
        </aside>

        <!-- Main content -->
        <div class="flex-1 flex flex-col min-w-0">
            <!-- Top header -->
            <header class="bg-white border-b shadow-sm px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
                <div class="flex items-center gap-3">
                    <button @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                    <h1 class="text-lg lg:text-xl font-bold text-gray-800">{{ $header ?? $title ?? 'Admin' }}</h1>
                </div>
                <div class="flex items-center gap-4">
                    <!-- Inline Empresa Switcher -->
                    @if($isSuperAdmin && $userEmpresas->count() > 1)
                        {{-- Superadmin: inline filter with search + "Ver todas" --}}
                        <div class="relative" x-data="{ open: false, search: '' }">
                            <button @click="open = !open" class="hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition px-3 py-2 rounded-lg hover:bg-gray-50">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                                <span class="max-w-32 truncate font-medium">{{ session('empresa_nombre') ?? 'Todas' }}</span>
                                <span class="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">{{ $userEmpresas->count() }}</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                            <div x-show="open" x-cloak @click.away="open = false"
                                 class="absolute right-0 mt-2 w-72 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
                                <div class="px-4 py-3 border-b bg-gray-50">
                                    <div class="text-xs text-gray-500 mb-2">Cambiar empresa activa</div>
                                    <input x-model="search" type="text" placeholder="Filtrar empresas..."
                                           class="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                </div>
                                <div class="max-h-64 overflow-y-auto py-1">
                                    @foreach($userEmpresas as $emp)
                                        <form method="POST" action="{{ route('empresa.set') }}" class="contents"
                                              x-show="!search || '{{ strtolower($emp->nombre) }}'.includes(search.toLowerCase())">
                                            @csrf
                                            <input type="hidden" name="empresa_id" value="{{ $emp->id }}">
                                            <button type="submit" class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 {{ $emp->id == $empresaId ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700' }}">
                                                @if($emp->id == $empresaId)
                                                    <svg class="w-4 h-4 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                                    </svg>
                                                @else
                                                    <span class="w-4 flex-shrink-0"></span>
                                                @endif
                                                <span class="truncate">{{ $emp->nombre }}</span>
                                            </button>
                                        </form>
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    @elseif($userEmpresas->count() > 1)
                        {{-- Normal role: simple switcher (changes scoping) --}}
                        <div class="relative" x-data="{ open: false }">
                            <button @click="open = !open" class="hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition px-3 py-2 rounded-lg hover:bg-gray-50">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                                </svg>
                                <span class="max-w-32 truncate">{{ session('empresa_nombre') ?? 'Empresa' }}</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                            <div x-show="open" x-cloak @click.away="open = false"
                                 class="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-lg py-2 z-50">
                                <div class="px-4 py-2 text-xs text-gray-500 border-b">Cambiar empresa</div>
                                @foreach($userEmpresas as $emp)
                                    <form method="POST" action="{{ route('empresa.set') }}" class="contents">
                                        @csrf
                                        <input type="hidden" name="empresa_id" value="{{ $emp->id }}">
                                        <button type="submit" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 {{ $emp->id == $empresaId ? 'bg-primary-50 text-primary-700' : 'text-gray-700' }}">
                                            @if($emp->id == $empresaId)
                                                <svg class="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                                </svg>
                                            @else
                                                <span class="w-4"></span>
                                            @endif
                                            {{ $emp->nombre }}
                                        </button>
                                    </form>
                                @endforeach
                            </div>
                        </div>
                    @elseif($userEmpresas->count() == 1)
                        <span class="hidden sm:flex text-sm text-gray-500 items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                            {{ session('empresa_nombre') ?? 'Empresa' }}
                        </span>
                    @endif

                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button class="text-sm text-gray-600 hover:text-red-600 transition flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            <span class="hidden sm:inline">Salir</span>
                        </button>
                    </form>
                </div>
            </header>

            <!-- Page content -->
            <main class="flex-1 p-4 lg:p-6 overflow-auto">
                @if(session('ok'))
                    <div class="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                        {{ session('ok') }}
                    </div>
                @endif
                @if(session('success'))
                    <div class="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                        {{ session('success') }}
                    </div>
                @endif
                @if(session('error'))
                    <div class="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                        {{ session('error') }}
                    </div>
                @endif
                @if($errors->any())
                    <div class="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                        <div class="flex items-center gap-2 font-medium">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                            Error
                        </div>
                        <ul class="list-disc ml-7 mt-2 text-sm">
                            @foreach($errors->all() as $e)<li>{{ $e }}</li>@endforeach
                        </ul>
                    </div>
                @endif
                @yield('content')
            </main>

            <!-- Footer -->
            <footer class="bg-white border-t px-6 py-3 text-center text-xs text-gray-500">
                Desarrollado por <a href="https://iados.mx" class="text-primary-600 hover:underline">iaDoS.mx</a> ·
                <a href="https://wa.me/528318989580" class="text-primary-600 hover:underline">WhatsApp: 8318989580</a>
            </footer>
        </div>
    </div>
</body>
</html>
