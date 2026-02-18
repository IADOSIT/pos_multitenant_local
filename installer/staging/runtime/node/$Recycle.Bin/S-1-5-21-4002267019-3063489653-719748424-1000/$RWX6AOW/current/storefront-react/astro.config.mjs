import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// EMC Abastos Premium Storefront
// Astro + React for optimal performance with SSG/ISR

export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'static', // SSG by default, can switch to 'hybrid' for ISR

  // API endpoints from Laravel backend
  site: process.env.PUBLIC_SITE_URL || 'https://emc-abastos.mx',

  build: {
    // Output to Laravel public folder for integration
    // Or deploy separately on Vercel/Netlify
    assets: 'assets'
  },

  vite: {
    define: {
      'import.meta.env.API_BASE_URL': JSON.stringify(
        process.env.API_BASE_URL || 'https://emc-abastos.mx/api/v1'
      )
    }
  }
});
