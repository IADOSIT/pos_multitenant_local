"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.puedeCotizar = puedeCotizar;
exports.puedeResponder = puedeResponder;
exports.folioCotizacion = folioCotizacion;
exports.calcularTotales = calcularTotales;
exports.vigenciaHasta = vigenciaHasta;
exports.estaVigente = estaVigente;
exports.direccionPlana = direccionPlana;
const COTIZABLES = ['solicitada', 'rechazada', 'vencida'];
function puedeCotizar(estado) {
    return COTIZABLES.includes(estado);
}
function puedeResponder(estado) {
    return estado === 'enviada';
}
function folioCotizacion(yy, consecutivo) {
    return `COT-${yy}-${String(consecutivo).padStart(4, '0')}`;
}
function calcularTotales(items, precios, descuento) {
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
function vigenciaHasta(desde, dias) {
    const d = new Date(desde.getTime());
    d.setUTCDate(d.getUTCDate() + dias);
    return d.toISOString().slice(0, 10);
}
function estaVigente(vigencia_hasta, hoy) {
    return hoy.toISOString().slice(0, 10) <= vigencia_hasta;
}
function direccionPlana(dir) {
    if (!dir)
        return null;
    if (typeof dir === 'string')
        return dir.slice(0, 300);
    const partes = ['calle', 'numero', 'colonia', 'ciudad', 'estado', 'cp', 'referencias']
        .map((k) => dir[k])
        .filter((v) => typeof v === 'string' && v.trim());
    return partes.length ? partes.join(', ').slice(0, 300) : null;
}
//# sourceMappingURL=cotizacion.logic.js.map