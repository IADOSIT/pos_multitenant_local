import api from './client';

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  loginPin: (pin: string, tienda_id: number) => api.post('/auth/login-pin', { pin, tienda_id }),
  me: () => api.get('/auth/me'),
};

// Users
export const usersApi = {
  list: () => api.get('/users'),
  get: (id: number) => api.get(`/users/${id}`),
  createWizard: (data: any) => api.post('/users/wizard', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  toggle: (id: number) => api.patch(`/users/${id}/toggle`),
};

// Tenants
export const tenantsApi = {
  list: () => api.get('/tenants'),
  get: (id: number) => api.get(`/tenants/${id}`),
  create: (data: any) => api.post('/tenants', data),
  update: (id: number, data: any) => api.put(`/tenants/${id}`, data),
};

// Empresas
export const empresasApi = {
  list: () => api.get('/empresas'),
  get: (id: number) => api.get(`/empresas/${id}`),
  create: (data: any) => api.post('/empresas', data),
  update: (id: number, data: any) => api.put(`/empresas/${id}`, data),
};

// Tiendas
export const tiendasApi = {
  list: () => api.get('/tiendas'),
  get: (id: number) => api.get(`/tiendas/${id}`),
  create: (data: any) => api.post('/tiendas', data),
  update: (id: number, data: any) => api.put(`/tiendas/${id}`, data),
};

// Categorías
export const categoriasApi = {
  list: () => api.get('/categorias'),
  get: (id: number) => api.get(`/categorias/${id}`),
  create: (data: any) => api.post('/categorias', data),
  update: (id: number, data: any) => api.put(`/categorias/${id}`, data),
};

// Productos
export const productosApi = {
  list: (categoriaId?: number) => api.get('/productos', { params: { categoria_id: categoriaId } }),
  forPOS: () => api.get('/productos/pos'),
  get: (id: number) => api.get(`/productos/${id}`),
  create: (data: any) => api.post('/productos', data),
  update: (id: number, data: any) => api.put(`/productos/${id}`, data),
  csvTemplate: () => api.get('/productos/csv/template', { responseType: 'blob' }),
  csvImport: (file: File, update: boolean) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/productos/csv/import?update=${update}`, form);
  },
};

// Ventas
export const ventasApi = {
  crear: (data: any) => api.post('/ventas', data),
  list: (desde?: string, hasta?: string) => api.get('/ventas', { params: { desde, hasta } }),
  get: (id: number) => api.get(`/ventas/${id}`),
  cancelar: (id: number, motivo: string) => api.post(`/ventas/${id}/cancelar`, { motivo }),
  sync: (ventas: any[]) => api.post('/ventas/sync', { ventas }),
};

// Caja
export const cajaApi = {
  abrir: (data: any) => api.post('/caja/abrir', data),
  cerrar: (id: number, data: any) => api.post(`/caja/${id}/cerrar`, data),
  movimiento: (id: number, data: any) => api.post(`/caja/${id}/movimiento`, data),
  corteX: (id: number) => api.get(`/caja/${id}/corte-x`),
  activa: () => api.get('/caja/activa'),
  list: () => api.get('/caja'),
};

// Dashboard
export const dashboardApi = {
  kpi: (desde: string, hasta: string, tiendaId?: number) =>
    api.get('/dashboard/kpi', { params: { desde, hasta, tienda_id: tiendaId } }),
  tendencia: (semanas?: number) => api.get('/dashboard/tendencia', { params: { semanas } }),
};

// Tickets
export const ticketsApi = {
  getConfig: () => api.get('/tickets/config'),
  saveConfig: (data: any) => api.post('/tickets/config', data),
  updateConfig: (id: number, data: any) => api.put(`/tickets/config/${id}`, data),
  preview: (venta: any) => api.post('/tickets/preview', { venta }),
};

// Print
export const printApi = {
  print: (content: string, config?: any) => api.post('/print', { content, config }),
  queue: () => api.get('/print/queue'),
};
