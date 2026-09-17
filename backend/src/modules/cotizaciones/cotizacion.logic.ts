import { CotizacionEstado } from './cotizacion.entity';
import { CotizacionItem } from './cotizacion-version.entity';

// Se puede cotizar (o RE-cotizar) mientras el trato siga vivo. Rechazada y vencida
// no son callejones sin salida a proposito: re-cotizar las reabre con el mismo
// folio y el mismo enlace, que es lo que convierte esto en una negociacion.
const COTIZABLES: CotizacionEstado[] = ['solicitada', 'rechazada', 'vencida'];

export function puedeCotizar(estado: CotizacionEstado): boolean {
  return COTIZABLES.includes(estado);
}

// Solo hay algo que responder cuando hay una version con precios en la mesa.
export function puedeResponder(estado: CotizacionEstado): boolean {
  return estado === 'enviada';
}

export function folioCotizacion(yy: string, consecutivo: number): string {
  return `COT-${yy}-${String(consecutivo).padStart(4, '0')}`;
}

export function calcularTotales(
  items: CotizacionItem[],
  precios: Map<number, number>,
  descuento: number,
): { items: CotizacionItem[]; subtotal: number; total: number } {
  let subtotal = 0;
  const conPrecio = items.map((it) => {
    const precio_unitario = precios.has(Number(it.producto_id))
      ? Number(precios.get(Number(it.producto_id)))
      : Number(it.precio_unitario || 0);
    const qty = Number(it.qty || 0);
    const sub = precio_unitario * qty;
    subtotal += sub;
    return { ...it, precio_unitario, subtotal: sub };
  });
  return { items: conPrecio, subtotal, total: Math.max(0, subtotal - Number(descuento || 0)) };
}

// Fecha, no timestamp: la vigencia se comunica como dia ("valida hasta el 2 de
// octubre") y vence al terminar ese dia, no a la hora exacta en que se envio.
export function vigenciaHasta(desde: Date, dias: number): string {
  const d = new Date(desde.getTime());
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function estaVigente(vigencia_hasta: string, hoy: Date): boolean {
  return hoy.toISOString().slice(0, 10) <= vigencia_hasta;
}

// La direccion del ecommerce (y la de una cotizacion web) es un JSON
// ({calle, colonia, ciudad...}); el pedido de mostrador guarda una sola linea de
// texto. Compartida por ecommerce.service.ts y cotizaciones.service.ts.
export function direccionPlana(dir: any): string | null {
  if (!dir) return null;
  if (typeof dir === 'string') return dir.slice(0, 300);
  const partes = ['calle', 'numero', 'colonia', 'ciudad', 'estado', 'cp', 'referencias']
    .map((k) => dir[k])
    .filter((v) => typeof v === 'string' && v.trim());
  return partes.length ? partes.join(', ').slice(0, 300) : null;
}
