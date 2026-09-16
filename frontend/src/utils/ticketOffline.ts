/**
 * Ticket impreso cuando no hay internet.
 *
 * Espejo del armado de `backend/src/modules/tickets/tickets.service.ts`
 * (generateTicketData) — mantener los dos en linea. Sin esto, una venta cobrada
 * offline no le entrega NADA al cliente, porque el ticket normal lo arma el
 * servidor. Usa la ultima configuracion de ticket que alcanzo a bajar el equipo.
 */

const LS_KEY = 'pos_ticket_config';

export function guardarConfigTicket(cfg: any) {
  try { if (cfg) localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch { /* modo privado */ }
}

export function configTicketCache(): any | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const money = (n: any) =>
  Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const center = (t: string, w: number) => ' '.repeat(Math.max(0, Math.floor((w - t.length) / 2))) + t;
const right = (t: string, w: number) => t.padStart(w);
const fila = (c1: string, c2: string, c3: string, c4: string) =>
  c1.padEnd(20) + c2.padStart(4) + c3.padStart(8) + c4.padStart(10);

/** `venta` es el mismo objeto que se encola offline (buildVentaData + folio_offline). */
export function ticketOfflineRaw(venta: any, folioOffline: string, cfg: any | null): string {
  const c = cfg || {};
  const w = c.columnas || 42;
  const l: string[] = [];

  if (c.encabezado_linea1) l.push(center(String(c.encabezado_linea1), w));
  if (c.encabezado_linea2) l.push(center(String(c.encabezado_linea2), w));
  if (c.encabezado_linea3) l.push(center(String(c.encabezado_linea3), w));
  l.push('='.repeat(w));
  if (venta.tipo_servicio === 'para_llevar') { l.push(center('*** PARA LLEVAR ***', w)); l.push(''); }
  l.push(`Folio: ${folioOffline}`);
  l.push(`Fecha: ${new Date().toLocaleString('es-MX')}`);
  l.push('-'.repeat(w));

  if (venta.cliente_nombre) l.push(`Cliente: ${venta.cliente_nombre}`);
  if (venta.cliente_telefono) l.push(`Tel:     ${venta.cliente_telefono}`);
  if (venta.cliente_direccion) l.push(`Dir:     ${venta.cliente_direccion}`);
  if (venta.cliente_nombre || venta.cliente_telefono || venta.cliente_direccion) l.push('-'.repeat(w));
  if (venta.notas) l.push(`Nota: ${venta.notas}`);

  l.push(fila('Producto', 'Cant', 'Precio', 'Subt'));
  l.push('-'.repeat(w));
  (venta.items || []).forEach((d: any) => {
    const sub = Number(d.cantidad) * Number(d.precio) - Number(d.descuento || 0);
    l.push(fila(String(d.nombre || '').substring(0, 20), String(d.cantidad), `$${money(d.precio)}`, `$${money(sub)}`));
    if (d.notas) l.push(`  > ${String(d.notas).substring(0, w - 4)}`);
  });

  l.push('-'.repeat(w));
  l.push(right(`Subtotal: $${money(venta.subtotal)}`, w));
  if (Number(venta.descuento) > 0) l.push(right(`Descuento: -$${money(venta.descuento)}`, w));
  if (Number(venta.impuestos) > 0) l.push(right(`Impuestos: $${money(venta.impuestos)}`, w));
  if (Number(venta.propina) > 0 && c.propina_en_ticket !== false) l.push(right(`Propina: $${money(venta.propina)}`, w));
  l.push(right(`TOTAL: $${money(venta.total)}`, w));
  l.push('='.repeat(w));

  if (venta.pago_efectivo) l.push(`Efectivo: $${money(venta.pago_efectivo)}`);
  if (venta.pago_tarjeta) l.push(`Tarjeta: $${money(venta.pago_tarjeta)}`);
  if (Number(venta.cambio) > 0) l.push(`Cambio: $${money(venta.cambio)}`);

  l.push('');
  l.push(center('*** COMPROBANTE SIN CONEXION ***', w));
  l.push(center('El folio definitivo se asigna al', w));
  l.push(center('restablecerse el internet.', w));
  l.push('');
  if (c.pie_linea1) l.push(center(String(c.pie_linea1), w));
  if (c.pie_linea2) l.push(center(String(c.pie_linea2), w));

  return l.join('\n');
}
