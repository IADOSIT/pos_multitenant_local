export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'superadmin' | 'admin' | 'manager' | 'cajero' | 'mesero';
  tenant_id: number;
  empresa_id: number;
  tienda_id: number;
  modulo?: string | null;
  empresa_nombre?: string;
  empresa_logo?: string;
  config_apariencia?: { tema: string; paleta: string } | null;
}

export interface Categoria {
  id: number;
  nombre: string;
  color?: string;
  icono?: string;
  imagen_url?: string;
  orden: number;
  es_seccion_especial: boolean;
  tipo_seccion?: string;
}

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  categoria_id: number;
  categoria?: Categoria;
  imagen_url?: string;
  disponible: boolean;
  modificadores?: any;
}

export interface CartItem {
  id: string;
  producto_id: number;
  sku: string;
  nombre: string;
  precio: number;
  precioManual?: number;
  cantidad: number;
  modificadores?: any;
  notas?: string;
  descuento: number;
  impuesto: number;
  subtotal: number;
  stock_actual?: number;
  controla_stock?: boolean;
  apartado_tienda_id?: number;
  apartado_tienda_nombre?: string;
}

export interface Venta {
  id?: number;
  folio?: string;
  folio_offline?: string;
  caja_id: number;
  items: CartItem[];
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  pago_efectivo?: number;
  pago_tarjeta?: number;
  pago_transferencia?: number;
  cambio: number;
  notas?: string;
  cliente_nombre?: string;
  pagos?: any[];
}

export interface CajaActiva {
  id: number;
  nombre: string;
  estado: 'abierta' | 'cerrada';
  fondo_apertura: number;
  total_ventas: number;
  fecha_apertura: string;
}

export interface KPI {
  total_ventas: number;
  num_tickets: number;
  ticket_promedio: number;
  cancelaciones: number;
  top_productos: { nombre: string; cantidad: number; total: number }[];
  ventas_por_hora: number[];
  metodos_pago: Record<string, number>;
  top_clientes?: { telefono: string; nombre: string; total_compras: number; total_gastado: number }[];
}

export interface PerfilNegocio {
  id: number;
  clave: string;
  nombre: string;
  descripcion?: string;
  config?: {
    modulos?: string[];
    modulos_config?: Record<string, { label: string; color: string; icono: string }>;
    inventario_critico?: boolean;
    alertas_stock?: boolean;
    productos_base?: any[];
  };
  activo: boolean;
}

export interface TenantPerfil {
  id: number;
  tenant_id: number;
  perfil_clave: string;
  config_override?: any;
  activo: boolean;
}

export interface AlertaStock {
  id: number;
  sku: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  unidad: string;
  modulo?: string;
  deficit: number;
}

// ── Logística ────────────────────────────────────────────────────────────

export interface Repartidor {
  id: number;
  tenant_id: number;
  empresa_id: number;
  nombre: string;
  telefono?: string;
  activo: boolean;
  token: string;
  created_at: string;
  updated_at: string;
}

export type EstadoEntrega = 'asignado' | 'en_camino' | 'entregado' | 'con_problema';

export interface EntregaPedido {
  id: number;
  tenant_id: number;
  empresa_id: number;
  tienda_id: number;
  pedido_id: number;
  repartidor_id: number;
  repartidor_nombre: string;
  pedido_folio: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  total: number;
  estado: EstadoEntrega;
  notas_repartidor?: string;
  entregado_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConfigLogistica {
  id: number;
  empresa_id: number;
  tenant_id: number;
  modulo_habilitado: boolean;
  notif_whatsapp_enabled: boolean;
  notif_whatsapp_token?: string;
  notif_whatsapp_numero?: string;
  notif_whatsapp_account_sid?: string;
  notif_proveedor?: string;
  msg_asignado?: string;
  msg_en_camino?: string;
  msg_entregado?: string;
  msg_con_problema?: string;
  msg_pedido_confirmado?: string;
  msg_pedido_listo?: string;
  msg_pedido_entregado?: string;
  msg_pedido_rechazado?: string;
}

export interface MetricasLogistica {
  total: number;
  entregadas: number;
  en_camino: number;
  con_problema: number;
  tiempo_promedio_min: number;
  por_repartidor: {
    repartidor_id: number;
    repartidor_nombre: string;
    total: number;
    entregadas: number;
    con_problema: number;
  }[];
}

export interface ConfigEspecialEmpresa {
  mostrar_precios?: boolean;
  precio_manual?: boolean;
  notif_cliente_estados?: boolean;
  empleados_enabled?: boolean;
  campos_formulario?: Record<string, { activo: boolean; requerido: boolean; selforder: boolean; ecommerce: boolean; label: string }>;
}

export interface Empleado {
  id: number; tenant_id: number; empresa_id: number;
  nombre: string; apellido?: string; cargo?: string; departamento?: string;
  email?: string; telefono?: string; imagen_url?: string;
  fmd_template?: string | null; fmd_enrolled_at?: string;
  activo: boolean; created_at: string;
}
export interface RegistroAsistencia {
  id: number; empleado_id: number; empleado_nombre: string; fecha: string;
  timestamp_entrada: string; tipo: string;
  estado: 'puntual' | 'tarde' | 'sin_horario';
  minutos_tarde?: number; notas?: string;
}
export interface KPIsAsistencia {
  total_registros: number; puntuales: number; tardanzas: number; sin_horario: number;
  pct_puntualidad: number; promedio_minutos_tarde: number;
  empleados_presentes_hoy: number; empleados_tardanza_hoy: number;
  top_impuntuales: { empleado_id: number; empleado_nombre: string; tardanzas: number; avg_minutos_tarde: number }[];
  por_dia: { fecha: string; puntuales: number; tardanzas: number }[];
}
export interface ConfigBiometrico {
  id: number; empresa_id: number; empresa_token: string;
  activo: boolean; open_device_enabled: boolean; device_ip?: string;
}

export interface CampoFormularioConfig {
  activo: boolean;
  requerido: boolean;
  selforder: boolean;
  ecommerce: boolean;
  label: string;
}

export type CamposFormulario = Record<
  'nombre' | 'telefono' | 'email' | 'direccion' | 'empresa' | 'notas',
  CampoFormularioConfig
>;
