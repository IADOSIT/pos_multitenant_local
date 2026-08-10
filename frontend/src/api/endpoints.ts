import api from './client';

// Auth
export const authApi = {
  login:          (email: string, password: string) => api.post('/auth/login', { email, password }),
  loginPin:       (pin: string, tienda_id: number, user_id?: number) => api.post('/auth/login-pin', { pin, tienda_id, user_id }),
  me:             () => api.get('/auth/me'),
  tiendaUsers:    (tienda_id: number)               => api.get(`/auth/tienda-users?tienda_id=${tienda_id}`),
  verifyPin:      (pin: string, tienda_id: number)  => api.post('/auth/verify-pin', { pin, tienda_id }),
};

// Users
export const usersApi = {
  list: () => api.get('/users'),
  get: (id: number) => api.get(`/users/${id}`),
  createWizard: (data: any) => api.post('/users/wizard', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  toggle: (id: number) => api.patch(`/users/${id}/toggle`),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Tenants
export const tenantsApi = {
  list: () => api.get('/tenants'),
  get: (id: number) => api.get(`/tenants/${id}`),
  create: (data: any) => api.post('/tenants', data),
  update: (id: number, data: any) => api.put(`/tenants/${id}`, data),
  delete: (id: number) => api.delete(`/tenants/${id}`),
};

// Empresas
export const empresasApi = {
  list: () => api.get('/empresas'),
  get: (id: number) => api.get(`/empresas/${id}`),
  create: (data: any) => api.post('/empresas', data),
  update: (id: number, data: any) => api.put(`/empresas/${id}`, data),
  delete: (id: number) => api.delete(`/empresas/${id}`),
  uploadLogo: (id: number, file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post(`/empresas/${id}/upload-logo`, form);
  },
  setConfigEspecial: (id: number, data: Partial<{ mostrar_precios: boolean; precio_manual: boolean; notif_cliente_estados: boolean; empleados_enabled: boolean; campos_formulario: any }>) =>
    api.patch(`/empresas/${id}/config-especial`, data),
};

// Tiendas
export const tiendasApi = {
  list: () => api.get('/tiendas'),
  get: (id: number) => api.get(`/tiendas/${id}`),
  create: (data: any) => api.post('/tiendas', data),
  update: (id: number, data: any) => api.put(`/tiendas/${id}`, data),
  delete: (id: number) => api.delete(`/tiendas/${id}`),
};

// Categorías
export const categoriasApi = {
  list: () => api.get('/categorias'),
  get: (id: number) => api.get(`/categorias/${id}`),
  create: (data: any) => api.post('/categorias', data),
  update: (id: number, data: any) => api.put(`/categorias/${id}`, data),
  delete: (id: number) => api.delete(`/categorias/${id}`),
};

// Productos
export const productosApi = {
  list: (categoriaId?: number) => api.get('/productos', { params: { categoria_id: categoriaId } }),
  forPOS: () => api.get('/productos/pos'),
  get: (id: number) => api.get(`/productos/${id}`),
  create: (data: any) => api.post('/productos', data),
  update: (id: number, data: any) => api.put(`/productos/${id}`, data),
  delete: (id: number) => api.delete(`/productos/${id}`),
  imageSearch: (q: string) => api.get('/productos/image-search', { params: { q } }),
  getIaImagenesConfig: () => api.get('/productos/ia-imagenes-config'),
  saveIaImagenesConfig: (data: { provider?: 'pollinations' | 'openai'; openai_api_key?: string }) => api.put('/productos/ia-imagenes-config', data),
  generateImage: (prompt: string) => api.post('/productos/generate-image', { prompt }),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/productos/upload-image', form);
  },
  purgeInactive: () => api.post('/productos/purge-inactive'),
  csvTemplate: () => api.get('/productos/csv/template', { responseType: 'blob' }),
  csvImport: (file: File, update: boolean) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/productos/csv/import?update=${update}`, form);
  },
};

// Ecommerce (admin)
export const ecommerceApi = {
  getConfig: () => api.get('/ecommerce/config'),
  saveConfig: (data: any) => api.put('/ecommerce/config', data),
  verificarSubdominio: (sub: string) => api.get('/ecommerce/config/verificar-subdominio', { params: { subdominio: sub } }),
  generarSubdominio: (nombre: string) => api.post('/ecommerce/config/generar-subdominio', { nombre }),
  getTemas: () => api.get('/ecommerce/config/temas'),
  // Productos
  getProductoConfig: (id: number) => api.get(`/ecommerce/productos/${id}/config`),
  saveProductoConfig: (id: number, data: any) => api.put(`/ecommerce/productos/${id}/config`, data),
  bulkVisibilidad: (ids: number[], visible: boolean) => api.post('/ecommerce/productos/bulk-visibilidad', { ids, visible }),
  // Pedidos
  listPedidos: (params?: any) => api.get('/ecommerce/pedidos', { params }),
  getPedido: (id: number) => api.get(`/ecommerce/pedidos/${id}`),
  updateEstado: (id: number, estado: string, notas?: string) => api.put(`/ecommerce/pedidos/${id}/estado`, { estado, notas_internas: notas }),
  deletePedido: (id: number) => api.delete(`/ecommerce/pedidos/${id}`),
};

// Ventas
export const ventasApi = {
  crear: (data: any) => api.post('/ventas', data),
  list: (desde?: string, hasta?: string) => api.get('/ventas', { params: { desde, hasta } }),
  get: (id: number) => api.get(`/ventas/${id}`),
  cancelar: (id: number, motivo: string) => api.post(`/ventas/${id}/cancelar`, { motivo }),
  sync: (ventas: any[]) => api.post('/ventas/sync', { ventas }),
  clientes: (q?: string) => api.get('/ventas/clientes', { params: q ? { q } : {} }),
  buscar: (q: string) => api.get('/ventas/buscar', { params: { q } }),
};

// Devoluciones
export const devolucionesApi = {
  crear: (data: any) => api.post('/devoluciones', data),
  porVenta: (ventaId: number) => api.get(`/devoluciones/venta/${ventaId}`),
  list: (desde?: string, hasta?: string) => api.get('/devoluciones', { params: { desde, hasta } }),
};

// Caja
export const cajaApi = {
  abrir: (data: any) => api.post('/caja/abrir', data),
  cerrar: (id: number, data: any) => api.post(`/caja/${id}/cerrar`, data),
  movimiento: (id: number, data: any) => api.post(`/caja/${id}/movimiento`, data),
  corteX: (id: number) => api.get(`/caja/${id}/corte-x`),
  activa: () => api.get('/caja/activa'),
  list: () => api.get('/caja'),
  reporte: (id: number) => api.get(`/caja/${id}/reporte`),
};

// Pedidos
export const pedidosApi = {
  crear: (data: any) => api.post('/pedidos', data),
  list: (estado?: string) => api.get('/pedidos', { params: { estado } }),
  pendientes: () => api.get('/pedidos/pendientes'),
  count: () => api.get('/pedidos/count'),
  get: (id: number) => api.get(`/pedidos/${id}`),
  updateEstado: (id: number, estado: string) => api.patch(`/pedidos/${id}/estado`, { estado }),
  cobrar: (id: number, pagoData: any) => api.post(`/pedidos/${id}/cobrar`, pagoData),
  cobrarParcial: (id: number, pagoData: any) => api.post(`/pedidos/${id}/cobrar-parcial`, pagoData),
  actualizarItems: (id: number, data: any) => api.put(`/pedidos/${id}/items`, data),
  cancelar: (id: number, motivo: string) => api.post(`/pedidos/${id}/cancelar`, { motivo }),
  buscarClientes: (q: string) => api.get('/pedidos/clientes/buscar', { params: { q } }),
};

// Dashboard
export const dashboardApi = {
  kpi: (desde: string, hasta: string, tiendaId?: number) =>
    api.get('/dashboard/kpi', { params: { desde, hasta, tienda_id: tiendaId } }),
  tendencia: (semanas?: number) => api.get('/dashboard/tendencia', { params: { semanas } }),
  pedidosCount: () => api.get('/dashboard/pedidos-count'),
  ventasCategoria: (desde: string, hasta: string) =>
    api.get('/dashboard/ventas-categoria', { params: { desde, hasta } }),
  ventasProducto: (desde: string, hasta: string, categoriaId?: number) =>
    api.get('/dashboard/ventas-producto', { params: { desde, hasta, categoria_id: categoriaId } }),
  ventasUnidad: (desde: string, hasta: string) =>
    api.get('/dashboard/ventas-unidad', { params: { desde, hasta } }),
};

// Tickets
export const ticketsApi = {
  getConfig: () => api.get('/tickets/config'),
  saveConfig: (data: any) => api.post('/tickets/config', data),
  updateConfig: (id: number, data: any) => api.put(`/tickets/config/${id}`, data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post('/tickets/upload-logo', form);
  },
  preview: (venta: any) => api.post('/tickets/preview', { venta }),
  precuenta: (data: any) => api.post('/tickets/precuenta', data),
};

// Licencias
export const licenciasApi = {
  estado: () => api.get('/licencias/estado'),
  activar: (codigo: string, machine_fingerprint?: string) => api.post('/licencias/activar', { codigo, machine_fingerprint }),
  activarConToken: (token: string, machine_fingerprint?: string) => api.post('/licencias/activar-token', { token, machine_fingerprint }),
  heartbeat: () => api.post('/licencias/heartbeat'),
  list: () => api.get('/licencias'),
  get: (id: number) => api.get(`/licencias/${id}`),
  generarCodigo: (data: any) => api.post('/licencias/generar-codigo', data),
  generarToken: (licencia_id: number, activation_code: string) => api.post('/licencias/generar-token', { licencia_id, activation_code }),
  suspender: (id: number) => api.post(`/licencias/${id}/suspender`),
  reactivar: (id: number) => api.post(`/licencias/${id}/reactivar`),
  update: (id: number, data: any) => api.put(`/licencias/${id}`, data),
  delete: (id: number) => api.delete(`/licencias/${id}`),
};

// Materia Prima
export const materiaPrimaApi = {
  list: () => api.get('/materia-prima'),
  get: (id: number) => api.get(`/materia-prima/${id}`),
  create: (data: any) => api.post('/materia-prima', data),
  update: (id: number, data: any) => api.put(`/materia-prima/${id}`, data),
  delete: (id: number) => api.delete(`/materia-prima/${id}`),
  deleteAll: () => api.post('/materia-prima/delete-all'),
  csvTemplate: () => api.get('/materia-prima/csv/template', { responseType: 'blob' }),
  csvExport: () => api.get('/materia-prima/csv/export', { responseType: 'blob' }),
  csvImport: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/materia-prima/csv/import', form);
  },
};

// Inventario
export const inventarioApi = {
  listStock: () => api.get('/inventario/stock'),
  listMovimientos: () => api.get('/inventario/movimientos'),
  getMovimientos: (productoId: number) => api.get(`/inventario/movimientos/${productoId}`),
  registrarMovimiento: (data: any) => api.post('/inventario/movimiento', data),
  updateProducto: (id: number, data: any) => api.put(`/inventario/producto/${id}`, data),
  csvTemplate: () => api.get('/inventario/csv/template', { responseType: 'blob' }),
  csvExport: () => api.get('/inventario/csv/export', { responseType: 'blob' }),
  csvImport: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/inventario/csv/import', form);
  },
};

// Print
export const printApi = {
  print: (content: string, config?: any) => api.post('/print', { content, config }),
  queue: () => api.get('/print/queue'),
};

// Menu Digital
export const menuDigitalApi = {
  getStatus:       (tiendaId: number) => api.get(`/menu-digital/config/${tiendaId}`),
  updateConfig:    (tiendaId: number, data: any) => api.put(`/menu-digital/config/${tiendaId}`, data),
  regenerateKey:   (tiendaId: number) => api.post(`/menu-digital/config/${tiendaId}/regenerate-key`),
  publish:         (tiendaId: number) => api.post(`/menu-digital/publish/${tiendaId}`),
  getServerInfo:   () => api.get('/menu-digital/server-info'),
  getLogs:         (tiendaId: number) => api.get(`/menu-digital/logs/${tiendaId}`),
  getPendingOrders:(tiendaId: number) => api.get(`/menu-digital/orders/${tiendaId}`),
  updateOrder:     (orderId: number, status: string, tiendaId: number) =>
    api.patch(`/menu-digital/orders/${orderId}/status`, { status, tienda_id: tiendaId }),
  // Public (no auth required - called directly)
  getPublicMenu:   (slug: string) => api.get(`/menu-digital/view/${slug}`),
  createOrder:     (slug: string, data: any) => api.post(`/menu-digital/view/${slug}/order`, data),
  getOrderStatus:  (token: string) => api.get(`/menu-digital/order-status/${token}`),
};

// Mesas
export const mesasApi = {
  list: () => api.get('/mesas'),
  create: (data: any) => api.post('/mesas', data),
  update: (id: number, data: any) => api.put(`/mesas/${id}`, data),
  remove: (id: number) => api.delete(`/mesas/${id}`),
  getAsignaciones: () => api.get('/mesas/asignaciones'),
  asignar: (mesa_id: number, user_id: number, user_nombre: string) =>
    api.post(`/mesas/${mesa_id}/asignar`, { user_id, user_nombre }),
  desasignar: (mesa_id: number) => api.delete(`/mesas/${mesa_id}/asignar`),
  getJuntas: () => api.get('/mesas/juntas'),
  juntar: (mesa_principal_id: number, mesa_secundaria_id: number) =>
    api.post('/mesas/juntar', { mesa_principal_id, mesa_secundaria_id }),
  separar: (mesa_principal_id: number, mesa_secundaria_id: number) =>
    api.post('/mesas/separar', { mesa_principal_id, mesa_secundaria_id }),
};

// Self Order
export const selfOrderApi = {
  // Public (customer phone — no auth needed)
  getTienda: (tienda_id: number, mesa_numero: number) =>
    api.get(`/public/self-order/${tienda_id}/${mesa_numero}`),
  getMenu: (tienda_id: number) =>
    api.get(`/public/self-order/${tienda_id}/menu/productos`),
  crearPedido: (tienda_id: number, mesa_numero: number, data: any) =>
    api.post(`/public/self-order/${tienda_id}/${mesa_numero}/pedido`, data),
  getStatus: (token: string) =>
    api.get(`/public/self-order/status/${token}`),
  responderEncuesta: (token: string, data: any) =>
    api.post(`/public/self-order/encuesta/${token}`, data),
  getTiendaBySlug: (slug: string, mesa_numero: number) =>
    api.get(`/public/self-order/s/${slug}/${mesa_numero}`),
  getMenuBySlug: (slug: string) =>
    api.get(`/public/self-order/s/${slug}/menu/productos`),
  crearPedidoBySlug: (slug: string, mesa_numero: number, data: any) =>
    api.post(`/public/self-order/s/${slug}/${mesa_numero}/pedido`, data),
  // Protected (mesero/admin in POS)
  confirmar: (pedido_id: number) => api.post(`/self-order/pedidos/${pedido_id}/confirmar`),
  rechazar: (pedido_id: number, motivo: string) =>
    api.post(`/self-order/pedidos/${pedido_id}/rechazar`, { motivo }),
  kpis: (desde?: string, hasta?: string) =>
    api.get('/self-order/kpis', { params: { desde, hasta } }),
};

// Encuestas
export const encuestasApi = {
  list: (limit?: number) => api.get('/encuestas', { params: { limit } }),
  kpis: (desde?: string, hasta?: string) =>
    api.get('/encuestas/kpis', { params: { desde, hasta } }),
};

// Pasarelas de Pago
export const pagosGatewayApi = {
  getConfig:        () => api.get('/pagos-gateway/config'),
  saveConfig:       (data: any) => api.put('/pagos-gateway/config', data),
  // MP QR
  crearQrMP:        (body: any) => api.post('/pagos-gateway/mp/qr', body),
  getEstadoMP:      (externalId: string) => api.get(`/pagos-gateway/mp/estado/${externalId}`),
  // MP Point
  crearPointMP:     (body: any) => api.post('/pagos-gateway/mp/point', body),
  getEstadoPoint:   (intentId: string) => api.get(`/pagos-gateway/mp/point/${intentId}`),
  // Stripe
  crearStripeIntent:(body: any) => api.post('/pagos-gateway/stripe/intent', body),
  getEstadoStripe:  (intentId: string) => api.get(`/pagos-gateway/stripe/estado/${intentId}`),
  // History
  getTransacciones: (limit?: number) => api.get('/pagos-gateway/transacciones', { params: { limit } }),
};

// Backup / Mantenimiento
export const backupApi = {
  getConfig:   () => api.get('/backup/config'),
  updateConfig:(data: any) => api.put('/backup/config', data),
  getLogs:     () => api.get('/backup/logs'),
  listFiles:   () => api.get('/backup/files'),
  ejecutar:    (tipo: 'db' | 'excel' | 'completo', tienda_id?: number) => api.post('/backup/ejecutar', { tipo, tienda_id }),
  download:    (filename: string) => api.get(`/backup/download/${filename}`, { responseType: 'blob' }),
  deleteLog:    (id: number) => api.delete(`/backup/${id}`),
  limpiarDemo:  (data: { ventas: boolean; pedidos: boolean; caja: boolean; inventario: boolean; productos?: boolean; categorias?: boolean }) =>
    api.post('/backup/limpiar-demo', data),
  testSftp:     () => api.post('/backup/test-sftp', {}, { timeout: 15000 }),
  validar:      (filename: string) => api.post('/backup/validar', { filename }),
  restaurar:    (filename: string) => api.post('/backup/restaurar', { filename }),
  importFile:   (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/backup/import', form);
  },
};

// Logística
export const logisticaApi = {
  getRepartidores: () => api.get('/logistica/repartidores'),
  createRepartidor: (data: any) => api.post('/logistica/repartidores', data),
  updateRepartidor: (id: number, data: any) => api.put(`/logistica/repartidores/${id}`, data),
  toggleRepartidor: (id: number) => api.patch(`/logistica/repartidores/${id}/toggle`),
  asignar: (pedido_id: number, repartidor_id: number) =>
    api.post('/logistica/asignar', { pedido_id, repartidor_id }),
  getEntregas: (params?: any) => api.get('/logistica/entregas', { params }),
  getEntregaByPedido: (pedido_id: number) => api.get(`/logistica/entregas/pedido/${pedido_id}`),
  updateEstado: (id: number, estado: string, notas?: string) =>
    api.patch(`/logistica/entregas/${id}/estado`, { estado, notas }),
  getConfig: () => api.get('/logistica/config'),
  upsertConfig: (data: any) => api.put('/logistica/config', data),
  getMetricas: (desde: string, hasta: string) =>
    api.get('/logistica/metricas', { params: { desde, hasta } }),
  getLogNotif: (pedido_id?: number) =>
    api.get('/logistica/notif-log', { params: pedido_id ? { pedido_id } : {} }),
  getRepartidorView: (token: string) => api.get(`/public/logistica/${token}`),
  updateEstadoByToken: (token: string, entrega_id: number, estado: string, notas?: string) =>
    api.patch(`/public/logistica/${token}/entrega/${entrega_id}`, { estado, notas }),
};

// Bascula de autoservicio (frutas y verduras)
export const basculaApi = {
  getConfig: (tiendaId: number) => api.get(`/bascula/config/${tiendaId}`),
  updateConfig: (tiendaId: number, data: any) => api.put(`/bascula/config/${tiendaId}`, data),
  regenerateToken: (tiendaId: number) => api.post(`/bascula/config/${tiendaId}/regenerate-token`),
  getProductos: (tiendaId: number) => api.get(`/bascula/productos/${tiendaId}`),
  registrarPesaje: (data: { tienda_id: number; producto_id: number; peso_kg: number }) =>
    api.post('/bascula/pesaje', data),
};

// Perfiles de Negocio
export const perfilesApi = {
  getActivo:      ()                     => api.get('/perfiles/activo'),
  activar:        (perfil_clave: string) => api.post('/perfiles/activar', { perfil_clave }),
  desactivar:     (clave: string)        => api.delete(`/perfiles/desactivar/${clave}`),
  alertasStock:   (modulo?: string)      => api.get('/perfiles/alertas-stock', { params: modulo ? { modulo } : {} }),
  resumenModulo:  (modulo: string)       => api.get(`/perfiles/resumen/${modulo}`),
  stockPorModulo: (modulo?: string)      => api.get('/inventario/stock-modulo', { params: modulo ? { modulo } : {} }),
};

// Empleados + Asistencia Biométrica
export const empleadosApi = {
  list:           ()                        => api.get('/empleados'),
  create:         (d: any)                  => api.post('/empleados', d),
  update:         (id: number, d: any)      => api.put(`/empleados/${id}`, d),
  toggle:         (id: number)              => api.patch(`/empleados/${id}/toggle`),
  clearHuella:    (id: number)              => api.delete(`/empleados/${id}/huella`),
  getHorario:     (id: number)              => api.get(`/empleados/${id}/horario`),
  setHorario:     (id: number, h: any[])    => api.put(`/empleados/${id}/horario`, { horarios: h }),
  getAsistencias: (params?: any)            => api.get('/empleados/asistencia', { params }),
  manual:         (d: any)                  => api.post('/empleados/asistencia/manual', d),
  delRegistro:    (id: number)              => api.delete(`/empleados/asistencia/${id}`),
  kpis:           (desde?: string, hasta?: string) => api.get('/empleados/asistencia/kpis', { params: { desde, hasta } }),
  getBioConfig:   ()                        => api.get('/empleados/biometrico/config'),
  putBioConfig:   (d: any)                  => api.put('/empleados/biometrico/config', d),
  regenToken:     ()                        => api.patch('/empleados/biometrico/regenerar-token'),
};
