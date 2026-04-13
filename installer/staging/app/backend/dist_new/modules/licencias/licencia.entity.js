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
exports.Licencia = exports.LicenciaEstado = exports.LicenciaPlan = void 0;
const typeorm_1 = require("typeorm");
var LicenciaPlan;
(function (LicenciaPlan) {
    LicenciaPlan["BASICO"] = "basico";
    LicenciaPlan["PRO"] = "pro";
    LicenciaPlan["ENTERPRISE"] = "enterprise";
})(LicenciaPlan || (exports.LicenciaPlan = LicenciaPlan = {}));
var LicenciaEstado;
(function (LicenciaEstado) {
    LicenciaEstado["TRIAL"] = "trial";
    LicenciaEstado["ACTIVA"] = "activa";
    LicenciaEstado["SUSPENDIDA"] = "suspendida";
    LicenciaEstado["EXPIRADA"] = "expirada";
})(LicenciaEstado || (exports.LicenciaEstado = LicenciaEstado = {}));
let Licencia = class Licencia {
};
exports.Licencia = Licencia;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Licencia.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Licencia.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Licencia.prototype, "codigo_instalacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Licencia.prototype, "codigo_activacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: LicenciaPlan.BASICO }),
    __metadata("design:type", String)
], Licencia.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Licencia.prototype, "features", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Licencia.prototype, "max_tiendas", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 3 }),
    __metadata("design:type", Number)
], Licencia.prototype, "max_usuarios", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], Licencia.prototype, "fecha_inicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], Licencia.prototype, "fecha_fin", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 15 }),
    __metadata("design:type", Number)
], Licencia.prototype, "grace_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Licencia.prototype, "offline_allowed", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: LicenciaEstado.TRIAL }),
    __metadata("design:type", String)
], Licencia.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Licencia.prototype, "activated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Licencia.prototype, "last_heartbeat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Licencia.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Licencia.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Licencia.prototype, "updated_at", void 0);
exports.Licencia = Licencia = __decorate([
    (0, typeorm_1.Entity)('licencias')
], Licencia);
//# sourceMappingURL=licencia.entity.js.map