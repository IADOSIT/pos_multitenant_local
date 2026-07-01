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
exports.RegistroAsistencia = exports.EstadoAsistencia = void 0;
const typeorm_1 = require("typeorm");
var EstadoAsistencia;
(function (EstadoAsistencia) {
    EstadoAsistencia["PUNTUAL"] = "puntual";
    EstadoAsistencia["TARDE"] = "tarde";
    EstadoAsistencia["SIN_HORARIO"] = "sin_horario";
})(EstadoAsistencia || (exports.EstadoAsistencia = EstadoAsistencia = {}));
let RegistroAsistencia = class RegistroAsistencia {
};
exports.RegistroAsistencia = RegistroAsistencia;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RegistroAsistencia.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RegistroAsistencia.prototype, "empleado_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RegistroAsistencia.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RegistroAsistencia.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], RegistroAsistencia.prototype, "empleado_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], RegistroAsistencia.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], RegistroAsistencia.prototype, "timestamp_entrada", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'biometrico' }),
    __metadata("design:type", String)
], RegistroAsistencia.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EstadoAsistencia, default: EstadoAsistencia.SIN_HORARIO }),
    __metadata("design:type", String)
], RegistroAsistencia.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], RegistroAsistencia.prototype, "minutos_tarde", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RegistroAsistencia.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RegistroAsistencia.prototype, "created_at", void 0);
exports.RegistroAsistencia = RegistroAsistencia = __decorate([
    (0, typeorm_1.Entity)('registros_asistencia'),
    (0, typeorm_1.Index)(['empleado_id', 'fecha']),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id', 'fecha'])
], RegistroAsistencia);
//# sourceMappingURL=registro-asistencia.entity.js.map