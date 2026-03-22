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
exports.PedidoDetalle = exports.Pedido = exports.PedidoEstado = void 0;
const typeorm_1 = require("typeorm");
var PedidoEstado;
(function (PedidoEstado) {
    PedidoEstado["RECIBIDO"] = "recibido";
    PedidoEstado["EN_ELABORACION"] = "en_elaboracion";
    PedidoEstado["LISTO_PARA_ENTREGA"] = "listo_para_entrega";
    PedidoEstado["ENTREGADO"] = "entregado";
    PedidoEstado["CANCELADO"] = "cancelado";
})(PedidoEstado || (exports.PedidoEstado = PedidoEstado = {}));
let Pedido = class Pedido {
};
exports.Pedido = Pedido;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Pedido.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Pedido.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Pedido.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Pedido.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Pedido.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Pedido.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Pedido.prototype, "mesa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PedidoEstado, default: PedidoEstado.RECIBIDO }),
    __metadata("design:type", String)
], Pedido.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Pedido.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Pedido.prototype, "descuento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Pedido.prototype, "impuestos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Pedido.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], Pedido.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], Pedido.prototype, "cliente_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Pedido.prototype, "venta_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Pedido.prototype, "usuario_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Pedido.prototype, "self_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Pedido.prototype, "mesero_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], Pedido.prototype, "mesero_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Pedido.prototype, "mesero_confirmado", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Pedido.prototype, "encuesta_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'en_sitio' }),
    __metadata("design:type", String)
], Pedido.prototype, "tipo_servicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Pedido.prototype, "cuenta_abierta", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Pedido.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Pedido.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PedidoDetalle, (d) => d.pedido, { cascade: true }),
    __metadata("design:type", Array)
], Pedido.prototype, "detalles", void 0);
exports.Pedido = Pedido = __decorate([
    (0, typeorm_1.Entity)('pedidos'),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id', 'tienda_id']),
    (0, typeorm_1.Index)(['tienda_id', 'estado'])
], Pedido);
let PedidoDetalle = class PedidoDetalle {
};
exports.PedidoDetalle = PedidoDetalle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PedidoDetalle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PedidoDetalle.prototype, "pedido_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PedidoDetalle.prototype, "producto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], PedidoDetalle.prototype, "producto_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PedidoDetalle.prototype, "producto_sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PedidoDetalle.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PedidoDetalle.prototype, "precio_unitario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PedidoDetalle.prototype, "descuento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PedidoDetalle.prototype, "impuesto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PedidoDetalle.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], PedidoDetalle.prototype, "modificadores", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], PedidoDetalle.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pedido, (p) => p.detalles),
    (0, typeorm_1.JoinColumn)({ name: 'pedido_id' }),
    __metadata("design:type", Pedido)
], PedidoDetalle.prototype, "pedido", void 0);
exports.PedidoDetalle = PedidoDetalle = __decorate([
    (0, typeorm_1.Entity)('pedido_detalles'),
    (0, typeorm_1.Index)(['pedido_id'])
], PedidoDetalle);
//# sourceMappingURL=pedido.entity.js.map