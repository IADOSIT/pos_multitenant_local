@php
    $empresaId = session('empresa_id');
    $empresa = $empresaId ? \App\Models\Empresa::with('theme')->find($empresaId) : null;
    $themeResolver = new \App\Services\ThemeResolver($empresa);

    $appName = $empresa ? $empresa->getAppName() : 'Mercado De Abastos';
    $logoUrl = $empresa ? $empresa->getLogoUrl() : asset('storage/brand/logo-iados.png');

    // Get resolved colors
    $primaryColor = $themeResolver->color('primary');
    $secondaryColor = $themeResolver->color('secondary');
    $accentColor = $themeResolver->color('accent');
    $bannerConfig = $themeResolver->banner();
    $typography = $themeResolver->typography();
    $copyTexts = $themeResolver->copy();

    $cart = session('cart', []);
    $cartCount = array_sum($cart);
@endphp
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? $appName }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
    <script>
        tailwind.config = @json($themeResolver->tailwindConfig())
    </script>
    <style>
        :root {
            {{ $themeResolver->cssVariables() }};
        }
        body { font-family: {{ $typography['body_font'] }}; font-weight: {{ $typography['body_weight'] }}; }
        h1, h2, h3, h4, h5, h6 { font-family: {{ $typography['heading_font'] }}; font-weight: {{ $typography['heading_weight'] }}; }

        /* Dynamic primary color utilities */
        .bg-primary-600 { background-color: {{ $primaryColor }} !important; }
        .bg-primary-700 { background-color: color-mix(in srgb, {{ $primaryColor }} 85%, black) !important; }
        .bg-primary-50 { background-color: color-mix(in srgb, {{ $primaryColor }} 10%, white) !important; }
        .bg-primary-100 { background-color: color-mix(in srgb, {{ $primaryColor }} 20%, white) !important; }
        .text-primary-600 { color: {{ $primaryColor }} !important; }
        .text-primary-700 { color: color-mix(in srgb, {{ $primaryColor }} 85%, black) !important; }
        .border-primary-500 { border-color: {{ $primaryColor }} !important; }
        .ring-primary-500 { --tw-ring-color: {{ $primaryColor }} !important; }
        .hover\:bg-primary-700:hover { background-color: color-mix(in srgb, {{ $primaryColor }} 85%, black) !important; }
        .focus\:ring-primary-500:focus { --tw-ring-color: {{ $primaryColor }} !important; }

        /* Full-width banner */
        .banner-full-width {
            width: 100vw;
            position: relative;
            left: 50%;
            right: 50%;
            margin-left: -50vw;
            margin-right: -50vw;
        }

        /* Accessible banner overlays */
        .banner-overlay-gradient-dark {
            background: linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
        }
        .banner-overlay-gradient-light {
            background: linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
        }
        .banner-overlay-gradient-radial {
            background: radial-gradient(ellipse at left center, rgba(0,0,0,0.6) 0%, transparent 70%);
        }

        /* Animations */
        .toast-enter { animation: slideIn 0.3s ease-out; }
        .toast-leave { animation: slideOut 0.3s ease-in forwards; }
        @keyframes slideIn { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-100%); opacity: 0; } }
    </style>
</head>
<body class="min-h-screen bg-gray-50 text-gray-900" x-data="cartStore()">
    <!-- Toast Notifications -->
    <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>

    <div class="max-w-6xl mx-auto px-4">
        <header class="py-4 flex items-center justify-between gap-3">
            <a href="{{ route('store.home') }}" class="flex items-center gap-3">
                @if($logoUrl)
                    <img src="{{ $logoUrl }}" alt="{{ $appName }}" class="h-10 w-auto">
                @endif
                <span class="font-bold text-xl hidden sm:inline">{{ $appName }}</span>
            </a>
            <nav class="flex items-center gap-2 text-sm">
                <a class="px-3 py-2 rounded hover:bg-gray-100" href="{{ route('store.home') }}">Tienda</a>
                <a class="px-3 py-2 rounded hover:bg-gray-100 relative" href="{{ route('cart.index') }}">
                    Carrito
                    <span x-show="cartCount > 0" x-text="cartCount"
                          class="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                          x-cloak></span>
                </a>
                @auth
                    <a class="px-3 py-2 rounded hover:bg-gray-100" href="{{ route('admin.dashboard') }}">Empresa</a>
                    @if(auth()->user()->isSuperAdmin() || auth()->user()->getRolForEmpresa(session('empresa_id'))?->slug === 'admin_empresa')
                        <a class="px-3 py-2 rounded bg-green-100 text-green-700" href="{{ route('admin.dashboard') }}">Admin</a>
                    @endif
                    <form method="POST" action="{{ route('logout') }}" class="inline">
                        @csrf
                        <button class="px-3 py-2 rounded hover:bg-gray-100">Salir</button>
                    </form>
                @else
                    <a class="px-3 py-2 rounded hover:bg-gray-100" href="{{ route('login') }}">Ingresar</a>
                    <a class="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700" href="{{ route('register') }}">Registrarse</a>
                @endauth
            </nav>
        </header>

        @if(session('ok'))
            <div class="mb-3 p-3 rounded bg-green-50 border border-green-200 text-green-800">{{ session('ok') }}</div>
        @endif
        @if(session('error'))
            <div class="mb-3 p-3 rounded bg-red-50 border border-red-200 text-red-800">{{ session('error') }}</div>
        @endif
        @if($errors->any())
            <div class="mb-3 p-3 rounded bg-red-50 border border-red-200 text-red-800">
                @foreach($errors->all() as $e)<div>{{ $e }}</div>@endforeach
            </div>
        @endif

        <main class="pb-10">
            @yield('content')
        </main>

        <footer class="py-8 text-xs text-gray-500 border-t">
            <div class="flex items-center justify-between">
                <div>{{ $appName }} · {{ date('Y') }}</div>
                <div>
                    Desarrollado por <a href="https://iados.mx" class="text-green-600 hover:underline">iaDoS.mx</a>
                </div>
            </div>
        </footer>
    </div>

    <script>
        function cartStore() {
            return {
                cartCount: {{ $cartCount }},
                cartTotal: '$0.00',
                init() {
                    this.fetchSummary();
                },
                async fetchSummary() {
                    try {
                        const res = await fetch('{{ route('cart.summary') }}');
                        const data = await res.json();
                        this.cartCount = data.cart_count;
                        this.cartTotal = data.cart_total_formatted;
                    } catch (e) {}
                },
                async addToCart(productoId, qty = 1) {
                    const btn = event?.target;
                    const originalText = btn?.innerHTML;
                    if (btn) {
                        btn.disabled = true;
                        btn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';
                    }

                    try {
                        const res = await fetch('{{ route('cart.add') }}', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                            },
                            body: JSON.stringify({ producto_id: productoId, qty: qty })
                        });
                        const data = await res.json();

                        if (data.success) {
                            this.cartCount = data.cart_count;
                            this.cartTotal = data.cart_total_formatted;
                            this.showToast(data.message || 'Agregado al carrito', 'success');
                            if (btn) {
                                btn.innerHTML = '<svg class="h-5 w-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
                                setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 1000);
                            }
                        } else {
                            this.showToast(data.message || 'Error', 'error');
                            if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
                        }
                    } catch (e) {
                        this.showToast('Error al agregar', 'error');
                        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
                    }
                },
                showToast(message, type = 'success') {
                    const container = document.getElementById('toast-container');
                    const toast = document.createElement('div');
                    toast.className = `toast-enter px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white flex items-center gap-2`;
                    toast.innerHTML = `
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${type === 'success'
                                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
                                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'}
                        </svg>
                        <span>${message}</span>
                    `;
                    container.appendChild(toast);
                    setTimeout(() => {
                        toast.classList.remove('toast-enter');
                        toast.classList.add('toast-leave');
                        setTimeout(() => toast.remove(), 300);
                    }, 2500);
                }
            }
        }
    </script>
</body>
</html>
