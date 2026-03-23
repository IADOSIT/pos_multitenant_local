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
exports.MovimientoInventario = exports.MovimientoTipo = void 0;
const typeorm_1 = require("typeorm");
var MovimientoTipo;
(function (MovimientoTipo) {
    MovimientoTipo["ENTRADA"] = "entrada";
    MovimientoTipo["SALIDA"] = "salida";
    MovimientoTipo["AJUSTE"] = "ajuste";
    MovimientoTipo["DEVOLUCION"] = "devolucion";
})(MovimientoTipo || (exports.MovimientoTipo = MovimientoTipo = {}));
let MovimientoInventario = class MovimientoInventario {
};
exports.MovimientoInventario = MovimientoInventario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MovimientoInventario.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovimientoInventario.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovimientoInventario.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovimientoInventario.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovimientoInventario.prototype, "producto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], MovimientoInventario.prototype, "producto_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], MovimientoInventario.prototype, "producto_sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MovimientoTipo }),
    __metadata("design:type", String)
], MovimientoInventario.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], MovimientoInventario.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], MovimientoInventario.prototype, "stock_anterior", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], MovimientoInventario.prototype, "stock_nuevo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], MovimientoInventario.prototype, "concepto", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovimientoInventario.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], MovimientoInventario.prototype, "usuario_nombre", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MovimientoInventario.prototype, "created_at", void 0);
exports.MovimientoInventario = MovimientoInventario = __decorate([
    (0, typeorm_1.Entity)('movimientos_inventario'),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id', 'tienda_id']),
    (0, typeorm_1.Index)(['producto_id'])
], MovimientoInventario);
//# sourceMappingURL=inventario.entity.js.map