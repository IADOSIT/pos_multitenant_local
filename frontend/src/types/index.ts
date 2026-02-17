export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'superadmin' | 'admin' | 'manager' | 'cajero' | 'mesero';
  tenant_id: number;
  empresa_id: number;
  tienda_id: number;
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
}
