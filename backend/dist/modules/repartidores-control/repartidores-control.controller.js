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
exports.RepartidoresControlController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const repartidores_control_service_1 = require("./repartidores-control.service");
let RepartidoresControlController = class RepartidoresControlController {
    constructor(service) {
        this.service = service;
    }
    estado(scope) {
        return this.service.estado(scope);
    }
    listar(scope) {
        return this.service.listarRepartidores(scope);
    }
    crear(data, scope) {
        return this.service.crearRepartidor(data, scope);
    }
    actualizar(id, data, scope) {
        return this.service.actualizarRepartidor(id, data, scope);
    }
    regenerar(id, scope) {
        return this.service.regenerarCodigo(id, scope);
    }
    asignar(data, scope) {
        return this.service.asignar(data, scope);
    }
    reasignar(id, data, scope) {
        return this.service.reasignar(id, data, scope);
    }
    quitar(id, data, scope) {
        return this.service.quitar(id, data, scope);
    }
    tablero(scope) {
        return this.service.tablero(scope);
    }
    pendientes(id, scope) {
        return this.service.pendientesDe(id, scope);
    }
    liquidar(data, scope) {
        return this.service.liquidar(data, scope);
    }
    liquidaciones(q, scope) {
        return this.service.liquidaciones(q, scope);
    }
    liquidacion(id, scope) {
        return this.service.liquidacion(id, scope);
    }
    historial(q, scope) {
        return this.service.historial(q, scope);
    }
};
exports.RepartidoresControlController = RepartidoresControlController;
__decorate([
    (0, common_1.Get)('estado'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero', 'mesero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "estado", null);
__decorate([
    (0, common_1.Get)('repartidores'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero', 'mesero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)('repartidores'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "crear", null);
__decorate([
    (0, common_1.Put)('repartidores/:id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Post)('repartidores/:id/regenerar-codigo'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "regenerar", null);
__decorate([
    (0, common_1.Post)('asignar'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero', 'mesero'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "asignar", null);
__decorate([
    (0, common_1.Post)('asignaciones/:id/reasignar'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "reasignar", null);
__decorate([
    (0, common_1.Post)('asignaciones/:id/quitar'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "quitar", null);
__decorate([
    (0, common_1.Get)('tablero'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "tablero", null);
__decorate([
    (0, common_1.Get)('repartidores/:id/pendientes'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "pendientes", null);
__decorate([
    (0, common_1.Post)('liquidar'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "liquidar", null);
__decorate([
    (0, common_1.Get)('liquidaciones'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "liquidaciones", null);
__decorate([
    (0, common_1.Get)('liquidaciones/:id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "liquidacion", null);
__decorate([
    (0, common_1.Get)('historial'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RepartidoresControlController.prototype, "historial", null);
exports.RepartidoresControlController = RepartidoresControlController = __decorate([
    (0, common_1.Controller)('repartidores-control'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [repartidores_control_service_1.RepartidoresControlService])
], RepartidoresControlController);
//# sourceMappingURL=repartidores-control.controller.js.map