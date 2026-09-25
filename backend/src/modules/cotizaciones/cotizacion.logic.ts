import { CotizacionEstado } from './cotizacion.entity';
import { CotizacionItem } from './cotizacion-version.entity';

// Se puede cotizar (o RE-cotizar) mientras el trato siga vivo. Rechazada y vencida
// no son callejones sin salida a proposito: re-cotizar las reabre con el mismo
// folio y el mismo enlace, que es lo que convierte esto en una negociacion.
const COTIZABLES: CotizacionEstado[] = ['solicitada', 'rechazada', 'vencida'];

export function puedeCotizar(estado: CotizacionEstado): boolean {
  return COTIZABLES.includes(estado);
}

// Redondea a centavos: evita que 10.1 * 3 se guarde/sirva como
// 30.299999999999997 en el snapshot JSON de `items` (las columnas DECIMAL
// redondean solo, pero el JSON no).
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
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
    const sub = round2(precio_unitario * qty);
    subtotal += sub;
    return { ...it, precio_unitario, subtotal: sub };
  });
  subtotal = round2(subtotal);
  return { items: conPrecio, subtotal, total: round2(Math.max(0, subtotal - Number(descuento || 0))) };
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
