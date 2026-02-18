@props(['appName', 'logoUrl', 'primaryColor'])

<header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
    <div class="w-full px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 lg:h-20">
            <!-- Logo -->
            <a href="{{ route('store.home') }}" class="flex items-center gap-3 group">
                @if($logoUrl)
                    <img src="{{ $logoUrl }}" alt="{{ $appName }}" class="h-10 lg:h-12 w-auto transition-transform group-hover:scale-105" loading="lazy">
                @endif
                <span class="font-heading font-bold text-lg lg:text-xl text-slate-800 hidden sm:inline group-hover:text-[var(--brand-primary)] transition-colors">
                    {{ $appName }}
                </span>
            </a>

            <!-- Desktop Navigation -->
            <nav class="hidden md:flex items-center gap-1">
                <a href="{{ route('store.home') }}"
                   class="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-all">
                    Tienda
                </a>

                @auth
                    <a href="{{ route('admin.dashboard') }}"
                       class="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-all">
                        Mi Empresa
                    </a>
                    @if(auth()->user()->isSuperAdmin() || auth()->user()->getRolForEmpresa(session('empresa_id'))?->slug === 'admin_empresa')
                        <a href="{{ route('admin.dashboard') }}"
                           class="px-4 py-2 rounded-xl font-medium transition-all"
                           style="background-color: color-mix(in srgb, {{ $primaryColor }} 15%, white); color: {{ $primaryColor }};">
                            Admin
                        </a>
                    @endif
                @endauth
            </nav>

            <!-- Right Actions -->
            <div class="flex items-center gap-2 lg:gap-3">
                <!-- Cart Button -->
                <a href="{{ route('cart.index') }}"
                   class="relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all hover-lift"
                   style="background-color: {{ $primaryColor }}; color: white;">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <span class="hidden sm:inline">Carrito</span>
                    <span x-show="cartCount > 0" x-text="cartCount" x-cloak
                          class="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold rounded-full bg-white shadow-sm"
                          style="color: {{ $primaryColor }};">
                    </span>
                </a>

                <!-- Auth Buttons -->
                @guest
                    <a href="{{ route('login') }}"
                       class="hidden sm:flex px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-all">
                        Ingresar
                    </a>
                    <a href="{{ route('register') }}"
                       class="hidden sm:flex px-4 py-2.5 rounded-xl font-semibold border-2 transition-all hover-lift"
                       style="border-color: {{ $primaryColor }}; color: {{ $primaryColor }};">
                        Registrarse
                    </a>
                @else
                    <form method="POST" action="{{ route('logout') }}" class="hidden sm:block">
                        @csrf
                        <button type="submit"
                                class="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-all">
                            Salir
                        </button>
                    </form>
                @endguest

                <!-- Mobile Menu Button -->
                <button @click="mobileMenuOpen = !mobileMenuOpen"
                        class="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all">
                    <svg x-show="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                    <svg x-show="mobileMenuOpen" x-cloak class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Mobile Menu -->
    <div x-show="mobileMenuOpen" x-cloak
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 -translate-y-2"
         x-transition:enter-end="opacity-100 translate-y-0"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100 translate-y-0"
         x-transition:leave-end="opacity-0 -translate-y-2"
         class="md:hidden border-t border-slate-200 bg-white">
        <div class="px-4 py-4 space-y-2">
            <a href="{{ route('store.home') }}"
               class="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-all">
                Tienda
            </a>
            @auth
                <a href="{{ route('admin.dashboard') }}"
                   class="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-all">
                    Mi Empresa
                </a>
                @if(auth()->user()->isSuperAdmin() || auth()->user()->getRolForEmpresa(session('empresa_id'))?->slug === 'admin_empresa')
                    <a href="{{ route('admin.dashboard') }}"
                       class="block px-4 py-3 rounded-xl font-medium transition-all"
                       style="background-color: color-mix(in srgb, {{ $primaryColor }} 15%, white); color: {{ $primaryColor }};">
                        Panel Admin
                    </a>
                @endif
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="w-full text-left px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-all">
                        Cerrar sesion
                    </button>
                </form>
            @else
                <a href="{{ route('login') }}"
                   class="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-all">
                    Ingresar
                </a>
                <a href="{{ route('register') }}"
                   class="block px-4 py-3 rounded-xl font-semibold text-center transition-all"
                   style="background-color: {{ $primaryColor }}; color: white;">
                    Crear cuenta
                </a>
            @endauth
        </div>
    </div>
</header>
