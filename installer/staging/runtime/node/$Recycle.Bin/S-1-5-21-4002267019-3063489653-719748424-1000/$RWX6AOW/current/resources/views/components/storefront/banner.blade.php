@props([
    'title' => null,
    'subtitle' => null,
    'image' => null,
    'overlay' => 'dark',
    'height' => 'auto',
    'cta' => null,
    'ctaLink' => null,
    'fullBleed' => true
])

@php
    $heightClasses = match($height) {
        'small' => 'py-12 md:py-16',
        'medium' => 'py-16 md:py-24',
        'large' => 'py-24 md:py-32',
        'hero' => 'py-20 md:py-32 lg:py-40',
        default => 'py-16 md:py-24',
    };

    $overlayClasses = match($overlay) {
        'dark' => 'banner-overlay-dark',
        'light' => 'banner-overlay-light',
        'brand' => 'banner-overlay-brand',
        'none' => '',
        default => 'banner-overlay-dark',
    };

    $textColor = in_array($overlay, ['dark', 'brand']) ? 'text-white' : 'text-slate-800';
    $subtitleColor = in_array($overlay, ['dark', 'brand']) ? 'text-white/80' : 'text-slate-600';
@endphp

<section class="{{ $fullBleed ? 'full-bleed' : '' }} relative overflow-hidden"
         style="{{ $image ? "background-image: url('{$image}');" : '' }} background-size: cover; background-position: center;">
    @if(!$image)
        <!-- Gradient Background (when no image) -->
        <div class="absolute inset-0" style="background: linear-gradient(135deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 70%, #1e293b) 100%);"></div>
        <!-- Decorative Elements -->
        <div class="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
    @endif

    <!-- Overlay -->
    @if($image && $overlay !== 'none')
        <div class="absolute inset-0 {{ $overlayClasses }}"></div>
    @endif

    <!-- Content -->
    <div class="relative z-10 {{ $heightClasses }}">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="max-w-2xl">
                @if($title)
                    <h1 class="font-heading text-4xl md:text-5xl lg:text-6xl font-bold {{ $textColor }} leading-tight animate-slide-up">
                        {{ $title }}
                    </h1>
                @endif

                @if($subtitle)
                    <p class="mt-4 md:mt-6 text-lg md:text-xl {{ $subtitleColor }} leading-relaxed animate-slide-up" style="animation-delay: 0.1s;">
                        {{ $subtitle }}
                    </p>
                @endif

                {{ $slot }}

                @if($cta && $ctaLink)
                    <div class="mt-8 flex flex-wrap gap-4 animate-slide-up" style="animation-delay: 0.2s;">
                        <a href="{{ $ctaLink }}"
                           class="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-white text-slate-800 hover:bg-slate-100 shadow-premium-lg hover:shadow-premium-xl transition-all hover-lift">
                            {{ $cta }}
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                            </svg>
                        </a>
                    </div>
                @endif
            </div>
        </div>
    </div>
</section>
