import axios from 'axios';

// En Docker: nginx proxea /api -> backend:3000, así que usamos /api (relativo)
// En dev local: VITE_API_URL=http://localhost:3000/api
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
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
