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
exports.EcommercePedido = void 0;
const typeorm_1 = require("typeorm");
let EcommercePedido = class EcommercePedido {
};
exports.EcommercePedido = EcommercePedido;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EcommercePedido.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EcommercePedido.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EcommercePedido.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], EcommercePedido.prototype, "cliente_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], EcommercePedido.prototype, "numero_pedido", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['menudeo', 'mayoreo'], default: 'menudeo' }),
    __metadata("design:type", String)
], EcommercePedido.prototype, "tipo_venta", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], EcommercePedido.prototype, "cliente_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], EcommercePedido.prototype, "cliente_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], EcommercePedido.prototype, "cliente_tel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], EcommercePedido.prototype, "direccion_envio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], EcommercePedido.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], EcommercePedido.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EcommercePedido.prototype, "descuento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EcommercePedido.prototype, "iva", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], EcommercePedido.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'],
        default: 'pendiente',
    }),
    __metadata("design:type", String)
], EcommercePedido.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EcommercePedido.prototype, "notas_cliente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], EcommercePedido.prototype, "cliente_empresa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EcommercePedido.prototype, "notas_internas", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EcommercePedido.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EcommercePedido.prototype, "updated_at", void 0);
exports.EcommercePedido = EcommercePedido = __decorate([
    (0, typeorm_1.Entity)('ecommerce_pedidos'),
    (0, typeorm_1.Index)(['empresa_id', 'numero_pedido'], { unique: true }),
    (0, typeorm_1.Index)(['empresa_id']),
    (0, typeorm_1.Index)(['estado']),
    (0, typeorm_1.Index)(['created_at']),
    (0, typeorm_1.Index)(['cliente_id'])
], EcommercePedido);
//# sourceMappingURL=ecommerce-pedido.entity.js.map