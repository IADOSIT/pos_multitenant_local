import axios from 'axios';
import { hayConexion, marcarExito, marcarFalloRed } from './conexion';

// En Docker: nginx proxea /api -> backend:3000, así que usamos /api (relativo)
// En dev local: VITE_API_URL=http://localhost:3000/api
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Rutas que SIEMPRE salen a la red, aunque el cortacircuitos este abierto: el
// latido (es quien lo cierra) y el login (el cajero merece su intento real).
const SIEMPRE_INTENTAR = ['/health', '/auth/login', '/auth/login-pin', '/auth/verify-pin'];

/**
 * Error que imita a uno de red de axios: sin `response`, que es como el resto de
 * la app distingue "no hubo internet" de "el servidor dijo que no". Gracias a eso
 * el cobro sigue cayendo a la cola offline y cada pantalla a su cache.
 */
function errorSinConexion(config: any) {
  const err: any = new Error('Sin conexion con el servidor');
  err.code = 'ERR_SIN_CONEXION';
  err.config = config;
  err.request = {};
  err.isAxiosError = true;
  err.toJSON = () => ({ message: err.message, code: err.code });
  return err;
}

api.interceptors.request.use((config) => {
  // Cortacircuitos: con el servidor dado por caido no se espera el timeout de
  // 10 s por peticion (con ~15 peticiones al arrancar el POS eso dejaba la
  // pantalla muerta medio minuto). Se falla ya y la pantalla resuelve offline.
  const url = config.url || '';
  if (!hayConexion() && !SIEMPRE_INTENTAR.some((r) => url.includes(r))) {
    return Promise.reject(errorSinConexion(config));
  }

  const token = localStorage.getItem('pos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // "Ver como tienda" (solo superadmin) — ver src/store/adminContext.store.ts
  const userStr = localStorage.getItem('pos_user');
  const rol = userStr ? JSON.parse(userStr)?.rol : null;
  if (rol === 'superadmin') {
    const raw = localStorage.getItem('pos_view_as_tienda');
    if (raw) {
      try {
        const viewAs = JSON.parse(raw);
        config.headers['x-view-tenant-id'] = String(viewAs.tenant_id);
        config.headers['x-view-empresa-id'] = String(viewAs.empresa_id);
        config.headers['x-view-tienda-id'] = String(viewAs.tienda_id);
      } catch {}
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    marcarExito();
    return res;
  },
  (err) => {
    const url = err.config?.url || '';
    if (err.response) {
      // Contesto (aunque sea 4xx/5xx de la app): hay camino hasta el servidor.
      marcarExito();
    } else if (err.code !== 'ERR_SIN_CONEXION') {
      // Sin respuesta y no es nuestro propio corte: cuenta como fallo de red.
      marcarFalloRed();
    }
    // Excluir endpoints de auth que legítimamente devuelven 401 (no son sesión expirada)
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/verify-pin');
    const hasToken = !!localStorage.getItem('pos_token');
    if (err.response?.status === 401 && !isAuthEndpoint && hasToken) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// Resolve upload URLs: in dev with VITE_API_URL, prepend backend origin
export function resolveUploadUrl(path?: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl && path.startsWith('/api/')) {
    // VITE_API_URL = http://localhost:3000/api → extract origin
    const origin = apiUrl.replace(/\/api\/?$/, '');
    return origin + path;
  }
  return path;
}

export default api;
