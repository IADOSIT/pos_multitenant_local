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
exports.ApartadoInventario = exports.ApartadoEstado = void 0;
const typeorm_1 = require("typeorm");
var ApartadoEstado;
(function (ApartadoEstado) {
    ApartadoEstado["PENDIENTE"] = "pendiente";
    ApartadoEstado["ENTREGADO"] = "entregado";
    ApartadoEstado["CANCELADO"] = "cancelado";
})(ApartadoEstado || (exports.ApartadoEstado = ApartadoEstado = {}));
let ApartadoInventario = class ApartadoInventario {
};
exports.ApartadoInventario = ApartadoInventario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "tienda_origen_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "tienda_destino_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "venta_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30 }),
    __metadata("design:type", String)
], ApartadoInventario.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "producto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], ApartadoInventario.prototype, "producto_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], ApartadoInventario.prototype, "cliente_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], ApartadoInventario.prototype, "cliente_telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: ApartadoEstado.PENDIENTE }),
    __metadata("design:type", String)
], ApartadoInventario.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "usuario_creo_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], ApartadoInventario.prototype, "usuario_creo_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ApartadoInventario.prototype, "usuario_entrego_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], ApartadoInventario.prototype, "usuario_entrego_nombre", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ApartadoInventario.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], ApartadoInventario.prototype, "entregado_at", void 0);
exports.ApartadoInventario = ApartadoInventario = __decorate([
    (0, typeorm_1.Entity)('apartados_inventario'),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id']),
    (0, typeorm_1.Index)(['tienda_destino_id', 'estado']),
    (0, typeorm_1.Index)(['folio'])
], ApartadoInventario);
//# sourceMappingURL=apartado.entity.js.map