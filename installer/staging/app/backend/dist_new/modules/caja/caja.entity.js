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
exports.MovimientoCaja = exports.Caja = exports.MovimientoCajaTipo = exports.CajaEstado = void 0;
const typeorm_1 = require("typeorm");
var CajaEstado;
(function (CajaEstado) {
    CajaEstado["ABIERTA"] = "abierta";
    CajaEstado["CERRADA"] = "cerrada";
})(CajaEstado || (exports.CajaEstado = CajaEstado = {}));
var MovimientoCajaTipo;
(function (MovimientoCajaTipo) {
    MovimientoCajaTipo["ENTRADA"] = "entrada";
    MovimientoCajaTipo["SALIDA"] = "salida";
})(MovimientoCajaTipo || (exports.MovimientoCajaTipo = MovimientoCajaTipo = {}));
let Caja = class Caja {
};
exports.Caja = Caja;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Caja.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Caja.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Caja.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Caja.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Caja.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Caja.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CajaEstado, default: CajaEstado.CERRADA }),
    __metadata("design:type", String)
], Caja.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Caja.prototype, "fondo_apertura", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Caja.prototype, "total_ventas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Caja.prototype, "total_entradas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Caja.prototype, "total_salidas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Caja.prototype, "total_esperado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Caja.prototype, "total_real", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Caja.prototype, "diferencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Caja.prototype, "fecha_apertura", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Caja.prototype, "fecha_cierre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], Caja.prototype, "notas_cierre", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Caja.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Caja.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MovimientoCaja, (m) => m.caja, { cascade: true }),
    __metadata("design:type", Array)
], Caja.prototype, "movimientos", void 0);
exports.Caja = Caja = __decorate([
    (0, typeorm_1.Entity)('cajas'),
    (0, typeorm_1.Index)(['tenant_id', 'tienda_id'])
], Caja);
let MovimientoCaja = class MovimientoCaja {
};
exports.MovimientoCaja = MovimientoCaja;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MovimientoCaja.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovimientoCaja.prototype, "caja_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovimientoCaja.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MovimientoCajaTipo }),
    __metadata("design:type", String)
], MovimientoCaja.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], MovimientoCaja.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], MovimientoCaja.prototype, "concepto", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], MovimientoCaja.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MovimientoCaja.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Caja, (c) => c.movimientos),
    (0, typeorm_1.JoinColumn)({ name: 'caja_id' }),
    __metadata("design:type", Caja)
], MovimientoCaja.prototype, "caja", void 0);
exports.MovimientoCaja = MovimientoCaja = __decorate([
    (0, typeorm_1.Entity)('movimientos_caja'),
    (0, typeorm_1.Index)(['caja_id'])
], MovimientoCaja);
//# sourceMappingURL=caja.entity.js.map