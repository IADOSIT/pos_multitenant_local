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
exports.TransferenciaInventario = exports.TransferenciaEstado = void 0;
const typeorm_1 = require("typeorm");
var TransferenciaEstado;
(function (TransferenciaEstado) {
    TransferenciaEstado["PENDIENTE"] = "pendiente";
    TransferenciaEstado["RECIBIDO"] = "recibido";
    TransferenciaEstado["CANCELADO"] = "cancelado";
})(TransferenciaEstado || (exports.TransferenciaEstado = TransferenciaEstado = {}));
let TransferenciaInventario = class TransferenciaInventario {
};
exports.TransferenciaInventario = TransferenciaInventario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TransferenciaInventario.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TransferenciaInventario.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TransferenciaInventario.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TransferenciaInventario.prototype, "tienda_origen_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], TransferenciaInventario.prototype, "tienda_origen_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TransferenciaInventario.prototype, "tienda_destino_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], TransferenciaInventario.prototype, "tienda_destino_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30 }),
    __metadata("design:type", String)
], TransferenciaInventario.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TransferenciaInventario.prototype, "producto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], TransferenciaInventario.prototype, "producto_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], TransferenciaInventario.prototype, "producto_sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], TransferenciaInventario.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], TransferenciaInventario.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: TransferenciaEstado.PENDIENTE }),
    __metadata("design:type", String)
], TransferenciaInventario.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TransferenciaInventario.prototype, "usuario_envio_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], TransferenciaInventario.prototype, "usuario_envio_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TransferenciaInventario.prototype, "usuario_recibio_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], TransferenciaInventario.prototype, "usuario_recibio_nombre", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TransferenciaInventario.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TransferenciaInventario.prototype, "recibido_at", void 0);
exports.TransferenciaInventario = TransferenciaInventario = __decorate([
    (0, typeorm_1.Entity)('transferencias_inventario'),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id']),
    (0, typeorm_1.Index)(['tienda_destino_id', 'estado']),
    (0, typeorm_1.Index)(['tienda_origen_id']),
    (0, typeorm_1.Index)(['folio'])
], TransferenciaInventario);
//# sourceMappingURL=transferencia.entity.js.map