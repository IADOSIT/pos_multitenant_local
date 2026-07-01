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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpleadosController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const empleados_service_1 = require("./empleados.service");
const asistencia_service_1 = require("./asistencia.service");
const biometrico_service_1 = require("./biometrico.service");
let EmpleadosController = class EmpleadosController {
    constructor(emp, asist, bio, ds) {
        this.emp = emp;
        this.asist = asist;
        this.bio = bio;
        this.ds = ds;
    }
    async checkModulo(scope) {
        if (scope.rol === 'superadmin')
            return;
        const [row] = await this.ds.query('SELECT config_especial FROM empresas WHERE id=? LIMIT 1', [scope.empresa_id]);
        const cfg = typeof row?.config_especial === 'string' ? JSON.parse(row.config_especial) : row?.config_especial;
        if (cfg?.empleados_enabled !== true) {
            throw new common_1.ForbiddenException('Módulo de empleados no habilitado para esta empresa');
        }
    }
    async list(s) { await this.checkModulo(s); return this.emp.findAll(s); }
    async create(d, s) { await this.checkModulo(s); return this.emp.create(d, s); }
    async update(id, d, s) {
        await this.checkModulo(s);
        return this.emp.update(id, d, s);
    }
    async toggle(id, s) {
        await this.checkModulo(s);
        return this.emp.toggle(id, s);
    }
    async clearHuella(id, s) {
        await this.checkModulo(s);
        return this.emp.clearFmdTemplate(id, s);
    }
    async getHorario(id, s) { await this.checkModulo(s); return this.emp.getHorarios(id, s); }
    async setHorario(id, b, s) {
        await this.checkModulo(s);
        return this.emp.setHorario(id, b.horarios || [], s);
    }
    async kpis(s, desde, hasta) {
        await this.checkModulo(s);
        const hoy = new Date().toISOString().split('T')[0];
        return this.asist.getKPIs(s, desde || hoy, hasta || hoy);
    }
    async asistencias(s, p) {
        await this.checkModulo(s);
        return this.asist.getAsistencias(s, p);
    }
    async manual(b, s) {
        await this.checkModulo(s);
        return this.asist.registrarManual(b.empleado_id, b.fecha, b.hora, b.notas, s);
    }
    async delRegistro(id, s) {
        await this.checkModulo(s);
        return this.asist.deleteRegistro(id, s);
    }
    async getCfg(s) { await this.checkModulo(s); return this.bio.getConfig(s); }
    async putCfg(d, s) { await this.checkModulo(s); return this.bio.upsertConfig(d, s); }
    async regenToken(s) { await this.checkModulo(s); return this.bio.regenerarToken(s); }
};
exports.EmpleadosController = EmpleadosController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "toggle", null);
__decorate([
    (0, common_1.Delete)(':id/huella'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "clearHuella", null);
__decorate([
    (0, common_1.Get)(':id/horario'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "getHorario", null);
__decorate([
    (0, common_1.Put)(':id/horario'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "setHorario", null);
__decorate([
    (0, common_1.Get)('asistencia/kpis'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('desde')),
    __param(2, (0, common_1.Query)('hasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "kpis", null);
__decorate([
    (0, common_1.Get)('asistencia'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "asistencias", null);
__decorate([
    (0, common_1.Post)('asistencia/manual'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "manual", null);
__decorate([
    (0, common_1.Delete)('asistencia/:id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "delRegistro", null);
__decorate([
    (0, common_1.Get)('biometrico/config'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "getCfg", null);
__decorate([
    (0, common_1.Put)('biometrico/config'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "putCfg", null);
__decorate([
    (0, common_1.Patch)('biometrico/regenerar-token'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmpleadosController.prototype, "regenToken", null);
exports.EmpleadosController = EmpleadosController = __decorate([
    (0, common_1.Controller)('empleados'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __param(3, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [empleados_service_1.EmpleadosService,
        asistencia_service_1.AsistenciaService,
        biometrico_service_1.BiometricoService,
        typeorm_2.DataSource])
], EmpleadosController);
//# sourceMappingURL=empleados.controller.js.map