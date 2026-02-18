/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        iados: {
          primary: 'rgb(var(--c-primary) / <alpha-value>)',
          secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
          accent: 'rgb(var(--c-accent) / <alpha-value>)',
          dark: 'rgb(var(--c-dark) / <alpha-value>)',
          surface: 'rgb(var(--c-surface) / <alpha-value>)',
          card: 'rgb(var(--c-card) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
