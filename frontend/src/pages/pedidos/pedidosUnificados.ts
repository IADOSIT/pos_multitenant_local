// Normaliza los dos flujos de pedidos que conviven en el POS a una sola fila.
//
// Son dos tablas distintas con estados distintos:
//   - `pedidos`            (mostrador / QR mesa): recibido → en_elaboracion → listo_para_entrega → entregado
//   - `ecommerce_pedidos`  (tienda en linea):     pendiente → confirmado → preparando → enviado → entregado
//
// Aqui se traducen a un vocabulario comun SOLO para mostrarlos juntos. Cada fila
// conserva `estadoRaw` (el estado que entiende su backend) y `raw` (el objeto
// original), asi que las acciones de cada flujo siguen operando sin cambios.
import {
  Clock, Check, Package, PackageCheck, Truck, XCircle,
  Store, Smartphone, ShoppingBag,
} from 'lucide-react';

export type Origen = 'mostrador' | 'qr' | 'web';

export type EstadoUnificado =
  | 'nuevo' | 'confirmado' | 'preparando' | 'listo' | 'enviado' | 'entregado' | 'cancelado';

export interface PedidoUnificado {
  /** Unico en el listado mezclado: los ids se repiten entre las dos tablas. */
  key: string;
  id: number;
  origen: Origen;
  /** folio (mostrador) o numero_pedido (web). */
  numero: string;
  /** "Mesa 5" o el nombre del cliente. */
  referencia: string;
  /** Segunda linea de la columna cliente: quien lo tomo, o el correo. */
  subtitulo: string;
  total: number;
  estado: EstadoUnificado;
  /** El estado tal cual lo guarda su backend. */
  estadoRaw: string;
  created_at: string;
  /** Self-order que el mesero todavia no confirma al cliente. */
  requiereAtencion: boolean;
  raw: any;
}

export const ORIGENES: Record<Origen, { label: string; icon: any; color: string; bg: string }> = {
  mostrador: { label: 'Mostrador', icon: Store,       color: 'text-slate-300',  bg: 'bg-slate-700/60' },
  qr:        { label: 'QR Mesa',   icon: Smartphone,  color: 'text-violet-300', bg: 'bg-violet-900/50' },
  web:       { label: 'Web',       icon: ShoppingBag, color: 'text-blue-300',   bg: 'bg-blue-900/50' },
};

export const ESTADOS_UNIFICADOS: Record<EstadoUnificado, { label: string; color: string; bg: string; icon: any }> = {
  nuevo:      { label: 'Nuevo',      color: 'text-yellow-300', bg: 'bg-yellow-900/40', icon: Clock },
  confirmado: { label: 'Confirmado', color: 'text-blue-300',   bg: 'bg-blue-900/40',   icon: Check },
  preparando: { label: 'Preparando', color: 'text-purple-300', bg: 'bg-purple-900/40', icon: Package },
  listo:      { label: 'Listo',      color: 'text-green-300',  bg: 'bg-green-900/40',  icon: PackageCheck },
  enviado:    { label: 'Enviado',    color: 'text-cyan-300',   bg: 'bg-cyan-900/40',   icon: Truck },
  entregado:  { label: 'Entregado',  color: 'text-slate-400',  bg: 'bg-slate-700/50',  icon: PackageCheck },
  cancelado:  { label: 'Cancelado',  color: 'text-red-400',    bg: 'bg-red-900/40',    icon: XCircle },
};

const ESTADO_POS: Record<string, EstadoUnificado> = {
  recibido: 'nuevo',
  en_elaboracion: 'preparando',
  listo_para_entrega: 'listo',
  entregado: 'entregado',
  cancelado: 'cancelado',
};

const ESTADO_WEB: Record<string, EstadoUnificado> = {
  pendiente: 'nuevo',
  confirmado: 'confirmado',
  preparando: 'preparando',
  enviado: 'enviado',
  entregado: 'entregado',
  cancelado: 'cancelado',
};

/** Siguiente estado de mostrador, en el vocabulario del backend de `pedidos`. */
const SIGUIENTE_POS: Record<string, string> = {
  recibido: 'en_elaboracion',
  en_elaboracion: 'listo_para_entrega',
};

/** Siguiente estado web, en el vocabulario del backend de `ecommerce_pedidos`. */
const SIGUIENTE_WEB: Record<string, string> = {
  pendiente: 'confirmado',
  confirmado: 'preparando',
  preparando: 'enviado',
  enviado: 'entregado',
};

export function normalizarPedidoPOS(p: any): PedidoUnificado {
  const esQR = !!p.self_order;
  return {
    key: `pos-${p.id}`,
    id: p.id,
    origen: esQR ? 'qr' : 'mostrador',
    numero: p.folio,
    referencia: p.mesa ? `Mesa ${p.mesa}` : (p.cliente_nombre || 'Mostrador'),
    subtitulo: p.usuario_nombre || (esQR ? p.cliente_nombre || 'Cliente' : 'Mesero'),
    total: Number(p.total) || 0,
    estado: ESTADO_POS[p.estado] || 'nuevo',
    estadoRaw: p.estado,
    created_at: p.created_at,
    requiereAtencion: esQR && !p.mesero_confirmado && p.estado === 'recibido',
    raw: p,
  };
}

export function normalizarPedidoWeb(p: any): PedidoUnificado {
  return {
    key: `web-${p.id}`,
    id: p.id,
    origen: 'web',
    numero: p.numero_pedido,
    referencia: p.cliente_nombre || 'Cliente',
    subtitulo: p.cliente_email || p.cliente_tel || '',
    total: Number(p.total) || 0,
    estado: ESTADO_WEB[p.estado] || 'nuevo',
    estadoRaw: p.estado,
    created_at: p.created_at,
    requiereAtencion: false,
    raw: p,
  };
}

/** Traduce un estado crudo de cualquiera de los dos backends al vocabulario comun. */
export function estadoUnificadoDe(origen: Origen, estadoRaw: string): EstadoUnificado {
  const mapa = origen === 'web' ? ESTADO_WEB : ESTADO_POS;
  return mapa[estadoRaw] || 'nuevo';
}

/** Un pedido cerrado ya no se opera: vive en la pestaña Completados. */
export function esCerrado(estado: EstadoUnificado): boolean {
  return estado === 'entregado' || estado === 'cancelado';
}

/**
 * Estado al que avanza el boton rapido de la tabla, en el vocabulario del backend
 * que corresponda — o `null` si desde la tabla no se debe avanzar.
 *
 * Devuelve null a proposito en dos casos de mostrador: un self-order sin confirmar
 * (primero hay que aceptarlo o rechazarlo) y un pedido `listo_para_entrega`, que no
 * "avanza" sino que se cobra, y cobrar exige caja abierta y pasa por su propio modal.
 */
export function siguienteEstadoRaw(p: PedidoUnificado): string | null {
  if (p.origen === 'web') return SIGUIENTE_WEB[p.estadoRaw] || null;
  if (p.requiereAtencion) return null;
  return SIGUIENTE_POS[p.estadoRaw] || null;
}

export function ordenarPorFecha(pedidos: PedidoUnificado[]): PedidoUnificado[] {
  return [...pedidos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function tiempoTranscurrido(fecha: string): string {
  const min = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (!isFinite(min) || min < 1) return 'Ahora';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ${min % 60}m`;
  return `${Math.floor(h / 24)}d`;
}
