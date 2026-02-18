@props(['flyers'])

@if($flyers && $flyers->count() > 0)
<section class="full-bleed relative overflow-hidden" x-data="heroSlider({{ $flyers->count() }})" @mouseenter="pause()" @mouseleave="resume()">
    <div class="relative">
        @foreach($flyers as $index => $flyer)
            <div x-show="currentSlide === {{ $index }}"
                 x-transition:enter="transition ease-out duration-700"
                 x-transition:enter-start="opacity-0 transform scale-105"
                 x-transition:enter-end="opacity-100 transform scale-100"
                 x-transition:leave="transition ease-in duration-500"
                 x-transition:leave-start="opacity-100"
                 x-transition:leave-end="opacity-0"
                 class="w-full">
                @if($flyer->link_url)
                    <a href="{{ $flyer->link_url }}" class="block">
                @endif
                    <div class="aspect-[21/9] md:aspect-[3/1] lg:aspect-[4/1] relative bg-slate-100">
                        <img src="{{ $flyer->imagen_url }}"
                             alt="{{ $flyer->alt_text ?? $flyer->titulo ?? 'Promocion' }}"
                             class="w-full h-full object-cover"
                             loading="{{ $index === 0 ? 'eager' : 'lazy' }}"
                             width="1920"
                             height="480"
                             onerror="this.onerror=null; this.src='/images/producto-default.svg';">

                        @if($flyer->titulo)
                            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                                <div class="w-full px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
                                    <div class="max-w-7xl mx-auto">
                                        <h2 class="font-heading text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg animate-slide-up">
                                            {{ $flyer->titulo }}
                                        </h2>
                                        @if($flyer->subtitulo ?? null)
                                            <p class="mt-2 text-lg text-white/90 max-w-xl">{{ $flyer->subtitulo }}</p>
                                        @endif
                                    </div>
                                </div>
                            </div>
                        @endif
                    </div>
                @if($flyer->link_url)
                    </a>
                @endif
            </div>
        @endforeach
    </div>

    <!-- Navigation Arrows -->
    @if($flyers->count() > 1)
        <button @click="prev()"
                class="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-slate-800 shadow-premium-lg transition-all hover:scale-110 z-10 backdrop-blur-sm">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
        </button>
        <button @click="next()"
                class="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-slate-800 shadow-premium-lg transition-all hover:scale-110 z-10 backdrop-blur-sm">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </button>

        <!-- Dots Indicators -->
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            @foreach($flyers as $index => $flyer)
                <button @click="goTo({{ $index }})"
                        :class="currentSlide === {{ $index }} ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70 w-3'"
                        class="h-3 rounded-full transition-all duration-300 shadow-sm"></button>
            @endforeach
        </div>
    @endif
</section>

<script>
function heroSlider(totalSlides) {
    return {
        currentSlide: 0,
        totalSlides: totalSlides,
        interval: null,
        autoplayDelay: 6000,

        init() {
            if (this.totalSlides > 1) {
                this.startAutoplay();
            }
        },

        startAutoplay() {
            this.interval = setInterval(() => this.next(), this.autoplayDelay);
        },

        pause() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        },

        resume() {
            if (!this.interval && this.totalSlides > 1) {
                this.startAutoplay();
            }
        },

        next() {
            this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        },

        prev() {
            this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        },

        goTo(index) {
            this.currentSlide = index;
        }
    }
}
</script>
@else
@php
    $empresaId = session('empresa_id');
    $empresa = $empresaId ? \App\Models\Empresa::with('theme')->find($empresaId) : null;
    $resolver = new \App\Services\ThemeResolver($empresa);
    $copy = $resolver->copy();
@endphp
<!-- Default Hero (when no flyers) -->
<x-storefront.banner
    :title="$copy['hero_title'] ?? 'Bienvenido a nuestra tienda'"
    :subtitle="$copy['hero_subtitle'] ?? 'Los mejores productos al mejor precio'"
    height="hero"
>
    <div class="mt-8 flex flex-wrap gap-4 animate-slide-up" style="animation-delay: 0.2s;">
        <a href="#productos"
           class="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-white text-slate-800 hover:bg-slate-100 shadow-premium-lg hover:shadow-premium-xl transition-all hover-lift">
            {{ $copy['cta_primary'] ?? 'Ver Productos' }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
        </a>
        <a href="{{ route('cart.index') }}"
           class="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Mi Carrito
        </a>
    </div>
</x-storefront.banner>
@endif
