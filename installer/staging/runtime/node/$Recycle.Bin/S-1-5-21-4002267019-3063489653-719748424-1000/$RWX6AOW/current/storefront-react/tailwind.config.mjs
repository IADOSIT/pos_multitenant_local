/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // These will be overridden per-store via CSS variables
        brand: {
          primary: 'var(--brand-primary, #059669)',
          secondary: 'var(--brand-secondary, #374151)',
          accent: 'var(--brand-accent, #10B981)',
        },
        primary: {
          50: 'color-mix(in srgb, var(--brand-primary, #059669) 10%, white)',
          100: 'color-mix(in srgb, var(--brand-primary, #059669) 20%, white)',
          200: 'color-mix(in srgb, var(--brand-primary, #059669) 30%, white)',
          300: 'color-mix(in srgb, var(--brand-primary, #059669) 50%, white)',
          400: 'color-mix(in srgb, var(--brand-primary, #059669) 70%, white)',
          500: 'var(--brand-primary, #059669)',
          600: 'var(--brand-primary, #059669)',
          700: 'color-mix(in srgb, var(--brand-primary, #059669) 85%, black)',
          800: 'color-mix(in srgb, var(--brand-primary, #059669) 70%, black)',
          900: 'color-mix(in srgb, var(--brand-primary, #059669) 50%, black)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(0,0,0,0.1), 0 2px 8px -2px rgba(0,0,0,0.06)',
        'premium-lg': '0 10px 40px -4px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.08)',
        'premium-xl': '0 20px 60px -8px rgba(0,0,0,0.15), 0 8px 24px -8px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'premium': 'var(--border-radius, 1rem)',
        'premium-lg': 'var(--border-radius-lg, 1.5rem)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
