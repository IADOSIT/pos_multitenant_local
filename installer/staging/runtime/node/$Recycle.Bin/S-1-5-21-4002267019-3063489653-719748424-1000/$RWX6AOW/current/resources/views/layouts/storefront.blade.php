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
    $themeStyles = $themeResolver->styles();
    $isDark = $themeResolver->isDarkMode();

    // Resolve fonts
    $headingFont = $typography['heading_font'] ?? 'Manrope';
    $bodyFont = $typography['body_font'] ?? 'Inter';
    $headingWeight = $typography['heading_weight'] ?? '700';
    $bodyWeight = $typography['body_weight'] ?? '400';

    // Build Google Fonts URL dynamically
    $fontsToLoad = collect([$headingFont, $bodyFont])->unique()->filter(fn($f) => !str_contains($f, 'system-ui'));
    $googleFontsUrl = $fontsToLoad->isNotEmpty()
        ? 'https://fonts.googleapis.com/css2?' . $fontsToLoad->map(fn($f) => 'family=' . urlencode($f) . ':wght@400;500;600;700;800')->implode('&') . '&display=swap'
        : null;

    $storeCart = (session('cart', []))[$empresaId] ?? [];
    $cartCount = 0;
    foreach ($storeCart as $item) {
        $cartCount += is_array($item) ? ($item['qty'] ?? 1) : (int)$item;
    }
@endphp
<!doctype html>
<html lang="es" class="scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="{{ $primaryColor }}">
    <title>{{ $title ?? $appName }}</title>

    <!-- Fonts (dynamic from theme) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    @if($googleFontsUrl)
        <link href="{{ $googleFontsUrl }}" rel="stylesheet">
    @endif

    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            primary: '{{ $primaryColor }}',
                            secondary: '{{ $secondaryColor }}',
                            accent: '{{ $accentColor }}',
                        },
                        primary: {
                            50: 'color-mix(in srgb, {{ $primaryColor }} 10%, white)',
                            100: 'color-mix(in srgb, {{ $primaryColor }} 20%, white)',
                            200: 'color-mix(in srgb, {{ $primaryColor }} 30%, white)',
                            300: 'color-mix(in srgb, {{ $primaryColor }} 50%, white)',
                            400: 'color-mix(in srgb, {{ $primaryColor }} 70%, white)',
                            500: '{{ $primaryColor }}',
                            600: '{{ $primaryColor }}',
                            700: 'color-mix(in srgb, {{ $primaryColor }} 85%, black)',
                            800: 'color-mix(in srgb, {{ $primaryColor }} 70%, black)',
                            900: 'color-mix(in srgb, {{ $primaryColor }} 50%, black)',
                        }
                    },
                    fontFamily: {
                        sans: ['{{ $bodyFont }}', 'system-ui', 'sans-serif'],
                        heading: ['{{ $headingFont }}', '{{ $bodyFont }}', 'system-ui', 'sans-serif'],
                    },
                    boxShadow: {
                        'premium': '0 4px 20px -2px rgba(0,0,0,0.1), 0 2px 8px -2px rgba(0,0,0,0.06)',
                        'premium-lg': '0 10px 40px -4px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.08)',
                        'premium-xl': '0 20px 60px -8px rgba(0,0,0,0.15), 0 8px 24px -8px rgba(0,0,0,0.1)',
                    },
                    animation: {
                        'fade-in': 'fadeIn 0.5s ease-out',
                        'slide-up': 'slideUp 0.5s ease-out',
                        'scale-in': 'scaleIn 0.3s ease-out',
                    }
                }
            }
        }
    </script>
    <style>
        :root {
            --brand-primary: {{ $primaryColor }};
            --brand-secondary: {{ $secondaryColor }};
            --brand-accent: {{ $accentColor }};
            --brand-bg: {{ $themeStyles['--bg-primary'] ?? '#f8fafc' }};
            --brand-surface: {{ $themeStyles['--bg-secondary'] ?? '#ffffff' }};
            --brand-text: {{ $themeStyles['--text-primary'] ?? '#1e293b' }};
            --brand-text-muted: {{ $themeStyles['--text-secondary'] ?? '#64748b' }};
            --brand-border: {{ $themeStyles['--border-color'] ?? '#e2e8f0' }};
            --brand-radius: {{ $themeStyles['--border-radius'] ?? '1rem' }};
            --brand-radius-lg: {{ $themeStyles['--border-radius-lg'] ?? '1.5rem' }};
            --brand-btn-radius: {{ $themeStyles['--button-radius'] ?? '0.75rem' }};
            --brand-shadow: {{ $themeStyles['--shadow-color'] ?? 'rgba(0,0,0,0.1)' }};
            @foreach($themeStyles as $k => $v)
            {{ $k }}: {{ $v }};
            @endforeach
        }

        body {
            font-family: '{{ $bodyFont }}', system-ui, sans-serif;
            font-weight: {{ $bodyWeight }};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        h1, h2, h3, h4, h5, h6, .font-heading {
            font-family: '{{ $headingFont }}', '{{ $bodyFont }}', system-ui, sans-serif;
            font-weight: {{ $headingWeight }};
        }

        /* Full-bleed utility */
        .full-bleed {
            width: 100vw;
            position: relative;
            left: 50%;
            right: 50%;
            margin-left: -50vw;
            margin-right: -50vw;
        }

        /* Premium transitions */
        .transition-premium {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Hover lift */
        .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px -8px rgba(0,0,0,0.15);
        }

        /* Banner overlays */
        .banner-overlay-dark {
            background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%);
        }
        .banner-overlay-light {
            background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 50%, transparent 100%);
        }
        .banner-overlay-brand {
            background: linear-gradient(135deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 80%, transparent) 100%);
        }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        /* Toast notifications */
        .toast-enter { animation: slideDown 0.3s ease-out; }
        .toast-leave { animation: slideUp 0.3s ease-in forwards; }
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* Scrollbar styling */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* Product image aspect ratio */
        .aspect-product { aspect-ratio: 1 / 1; }

        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="min-h-screen antialiased {{ $isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-slate-50 text-slate-800' }}" x-data="storefrontApp()">
    <!-- Toast Container -->
    <div id="toast-container" class="fixed top-4 right-4 z-[100] space-y-2"></div>

    <!-- Sticky Navigation -->
    <x-storefront.navbar :app-name="$appName" :logo-url="$logoUrl" :primary-color="$primaryColor" />

    <!-- Flash Messages -->
    @if(session('ok'))
        <div class="max-w-7xl mx-auto px-4 mt-4">
            <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>{{ session('ok') }}</span>
            </div>
        </div>
    @endif
    @if(session('error'))
        <div class="max-w-7xl mx-auto px-4 mt-4">
            <div class="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 animate-fade-in">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{{ session('error') }}</span>
            </div>
        </div>
    @endif
    @if($errors->any())
        <div class="max-w-7xl mx-auto px-4 mt-4">
            <div class="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800">
                @foreach($errors->all() as $e)<div>{{ $e }}</div>@endforeach
            </div>
        </div>
    @endif

    <!-- Main Content -->
    <main>
        @yield('content')
    </main>

    <!-- Premium Footer -->
    <x-storefront.footer :app-name="$appName" :primary-color="$primaryColor" />

    <!-- Alpine.js Store App -->
    <script>
        function storefrontApp() {
            return {
                cartCount: {{ $cartCount }},
                cartTotal: '$0.00',
                mobileMenuOpen: false,

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

                async addToCart(productoId, qty = 1, btn = null) {
                    const originalContent = btn?.innerHTML;
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
                                setTimeout(() => { btn.innerHTML = originalContent; btn.disabled = false; }, 1500);
                            }
                        } else {
                            this.showToast(data.message || 'Error', 'error');
                            if (btn) { btn.innerHTML = originalContent; btn.disabled = false; }
                        }
                    } catch (e) {
                        this.showToast('Error al agregar', 'error');
                        if (btn) { btn.innerHTML = originalContent; btn.disabled = false; }
                    }
                },

                showToast(message, type = 'success') {
                    const container = document.getElementById('toast-container');
                    const toast = document.createElement('div');
                    const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
                    toast.className = `toast-enter px-5 py-3 rounded-xl shadow-premium-lg ${bgColor} text-white flex items-center gap-3 font-medium`;
                    const icon = type === 'success'
                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>';
                    toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg><span>${message}</span>`;
                    container.appendChild(toast);
                    setTimeout(() => {
                        toast.classList.remove('toast-enter');
                        toast.classList.add('toast-leave');
                        setTimeout(() => toast.remove(), 300);
                    }, 3000);
                }
            }
        }
    </script>
</body>
</html>
