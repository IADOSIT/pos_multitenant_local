/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        iados: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          accent: '#f59e0b',
          dark: '#0f172a',
          surface: '#1e293b',
          card: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
