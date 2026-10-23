/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Sello del build inyectado por vite.config.ts (marca de agua de versión).
declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // '1' solo en el build en sitio (.env.onpremise). Ver api/socket.ts.
  readonly VITE_SOCKET_MISMO_ORIGEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
