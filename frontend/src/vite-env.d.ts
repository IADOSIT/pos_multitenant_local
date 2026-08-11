/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Sello del build inyectado por vite.config.ts (marca de agua de versión).
declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
