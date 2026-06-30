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
exports.EntregaPedido = exports.EstadoEntrega = void 0;
const typeorm_1 = require("typeorm");
var EstadoEntrega;
(function (EstadoEntrega) {
    EstadoEntrega["ASIGNADO"] = "asignado";
    EstadoEntrega["EN_CAMINO"] = "en_camino";
    EstadoEntrega["ENTREGADO"] = "entregado";
    EstadoEntrega["CON_PROBLEMA"] = "con_problema";
})(EstadoEntrega || (exports.EstadoEntrega = EstadoEntrega = {}));
let EntregaPedido = class EntregaPedido {
};
exports.EntregaPedido = EntregaPedido;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EntregaPedido.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EntregaPedido.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EntregaPedido.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EntregaPedido.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EntregaPedido.prototype, "pedido_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EntregaPedido.prototype, "repartidor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], EntregaPedido.prototype, "repartidor_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60 }),
    __metadata("design:type", String)
], EntregaPedido.prototype, "pedido_folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], EntregaPedido.prototype, "cliente_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], EntregaPedido.prototype, "cliente_telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], EntregaPedido.prototype, "cliente_direccion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EntregaPedido.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EstadoEntrega, default: EstadoEntrega.ASIGNADO }),
    __metadata("design:type", String)
], EntregaPedido.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EntregaPedido.prototype, "notas_repartidor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], EntregaPedido.prototype, "entregado_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EntregaPedido.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EntregaPedido.prototype, "updated_at", void 0);
exports.EntregaPedido = EntregaPedido = __decorate([
    (0, typeorm_1.Entity)('entregas_pedido'),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id']),
    (0, typeorm_1.Index)(['pedido_id']),
    (0, typeorm_1.Index)(['repartidor_id', 'estado'])
], EntregaPedido);
//# sourceMappingURL=entrega-pedido.entity.js.map