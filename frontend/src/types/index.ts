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
  cantidad: number;
  modificadores?: any;
  notas?: string;
  descuento: number;
  impuesto: number;
  subtotal: number;
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
  notif_proveedor?: string;
  msg_asignado?: string;
  msg_en_camino?: string;
  msg_entregado?: string;
  msg_con_problema?: string;
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
