"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VentaPago = exports.VentaDetalle = exports.Venta = exports.MetodoPago = exports.VentaEstado = void 0;
const typeorm_1 = require("typeorm");
var VentaEstado;
(function (VentaEstado) {
    VentaEstado["COMPLETADA"] = "completada";
    VentaEstado["CANCELADA"] = "cancelada";
    VentaEstado["PENDIENTE"] = "pendiente";
})(VentaEstado || (exports.VentaEstado = VentaEstado = {}));
var MetodoPago;
(function (MetodoPago) {
    MetodoPago["EFECTIVO"] = "efectivo";
    MetodoPago["TARJETA"] = "tarjeta";
    MetodoPago["TRANSFERENCIA"] = "transferencia";
    MetodoPago["MIXTO"] = "mixto";
})(MetodoPago || (exports.MetodoPago = MetodoPago = {}));
let Venta = class Venta {
};
exports.Venta = Venta;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Venta.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Venta.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Venta.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Venta.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Venta.prototype, "caja_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Venta.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Venta.prototype, "pedido_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Venta.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], Venta.prototype, "folio_offline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Venta.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Venta.prototype, "descuento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Venta.prototype, "impuestos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Venta.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MetodoPago, default: MetodoPago.EFECTIVO }),
    __metadata("design:type", String)
], Venta.prototype, "metodo_pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Venta.prototype, "pago_efectivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Venta.prototype, "pago_tarjeta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Venta.prototype, "pago_transferencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Venta.prototype, "cambio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: VentaEstado, default: VentaEstado.COMPLETADA }),
    __metadata("design:type", String)
], Venta.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], Venta.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], Venta.prototype, "cliente_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'en_sitio' }),
    __metadata("design:type", String)
], Venta.prototype, "tipo_servicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Venta.prototype, "sincronizado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Venta.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Venta.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => VentaDetalle, (d) => d.venta, { cascade: true }),
    __metadata("design:type", Array)
], Venta.prototype, "detalles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => VentaPago, (p) => p.venta, { cascade: true }),
    __metadata("design:type", Array)
], Venta.prototype, "pagos", void 0);
exports.Venta = Venta = __decorate([
    (0, typeorm_1.Entity)('ventas'),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id', 'tienda_id']),
    (0, typeorm_1.Index)(['tenant_id', 'created_at']),
    (0, typeorm_1.Index)(['folio', 'tenant_id'])
], Venta);
let VentaDetalle = class VentaDetalle {
};
exports.VentaDetalle = VentaDetalle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], VentaDetalle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VentaDetalle.prototype, "venta_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VentaDetalle.prototype, "producto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], VentaDetalle.prototype, "producto_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], VentaDetalle.prototype, "producto_sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], VentaDetalle.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], VentaDetalle.prototype, "precio_unitario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], VentaDetalle.prototype, "descuento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], VentaDetalle.prototype, "impuesto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], VentaDetalle.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], VentaDetalle.prototype, "modificadores", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], VentaDetalle.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Venta, (v) => v.detalles),
    (0, typeorm_1.JoinColumn)({ name: 'venta_id' }),
    __metadata("design:type", Venta)
], VentaDetalle.prototype, "venta", void 0);
exports.VentaDetalle = VentaDetalle = __decorate([
    (0, typeorm_1.Entity)('venta_detalles'),
    (0, typeorm_1.Index)(['venta_id'])
], VentaDetalle);
let VentaPago = class VentaPago {
};
exports.VentaPago = VentaPago;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], VentaPago.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VentaPago.prototype, "venta_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MetodoPago }),
    __metadata("design:type", String)
], VentaPago.prototype, "metodo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], VentaPago.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], VentaPago.prototype, "referencia", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Venta, (v) => v.pagos),
    (0, typeorm_1.JoinColumn)({ name: 'venta_id' }),
    __metadata("design:type", Venta)
], VentaPago.prototype, "venta", void 0);
exports.VentaPago = VentaPago = __decorate([
    (0, typeorm_1.Entity)('venta_pagos'),
    (0, typeorm_1.Index)(['venta_id'])
], VentaPago);
//# sourceMappingURL=venta.entity.js.map