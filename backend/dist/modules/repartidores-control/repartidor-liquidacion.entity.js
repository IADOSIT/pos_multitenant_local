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
exports.RepartidorLiquidacion = void 0;
const typeorm_1 = require("typeorm");
let RepartidorLiquidacion = class RepartidorLiquidacion {
};
exports.RepartidorLiquidacion = RepartidorLiquidacion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "repartidor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], RepartidorLiquidacion.prototype, "repartidor_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], RepartidorLiquidacion.prototype, "caja_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'total' }),
    __metadata("design:type", String)
], RepartidorLiquidacion.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "num_pedidos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "total_vendido", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "efectivo_esperado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "efectivo_recibido", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RepartidorLiquidacion.prototype, "diferencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], RepartidorLiquidacion.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], RepartidorLiquidacion.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], RepartidorLiquidacion.prototype, "usuario_nombre", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RepartidorLiquidacion.prototype, "created_at", void 0);
exports.RepartidorLiquidacion = RepartidorLiquidacion = __decorate([
    (0, typeorm_1.Entity)('repartidor_liquidaciones'),
    (0, typeorm_1.Index)(['tenant_id', 'tienda_id', 'created_at']),
    (0, typeorm_1.Index)(['repartidor_id'])
], RepartidorLiquidacion);
//# sourceMappingURL=repartidor-liquidacion.entity.js.map