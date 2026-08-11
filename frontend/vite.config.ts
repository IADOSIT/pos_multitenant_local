import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': cuando hay versión nueva se avisa (un clic en "Actualizar")
      // en vez de tener que recargar varias veces para que el SW la aplique.
      registerType: 'prompt',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'POS-iaDoS',
        short_name: 'POS-iaDoS',
        description: 'Sistema POS Touch Multitenant by iaDoS',
        theme_color: '#1e40af',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,       // limpia precache de builds viejos en el SW
        navigateFallbackDenylist: [/^\/api/], // /api nunca se sirve como la SPA
      },
    }),
  ],
  build: {
    outDir: 'dist-prod',
    emptyOutDir: true, // limpiar en cada build para no acumular assets viejos (bloat del precache)
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
