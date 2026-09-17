"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.puedeCotizar = puedeCotizar;
exports.calcularTotales = calcularTotales;
exports.direccionPlana = direccionPlana;
const COTIZABLES = ['solicitada', 'rechazada', 'vencida'];
function puedeCotizar(estado) {
    return COTIZABLES.includes(estado);
}
function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}
function calcularTotales(items, precios, descuento) {
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