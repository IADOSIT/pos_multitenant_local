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
exports.LogisticaController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const logistica_service_1 = require("./logistica.service");
let LogisticaController = class LogisticaController {
    constructor(service) {
        this.service = service;
    }
    getRepartidores(scope) {
        return this.service.getRepartidores(scope);
    }
    createRepartidor(data, scope) {
        return this.service.createRepartidor(data, scope);
    }
    updateRepartidor(id, data, scope) {
        return this.service.updateRepartidor(id, data, scope);
    }
    toggleRepartidor(id, scope) {
        return this.service.toggleRepartidor(id, scope);
    }
    asignar(body, scope) {
        return this.service.asignarRepartidor(body.pedido_id, body.repartidor_id, scope);
    }
    getEntregas(scope, params) {
        return this.service.getEntregas(scope, params);
    }
    getEntregaByPedido(pedido_id, scope) {
        return this.service.getEntregaByPedido(pedido_id, scope);
    }
    updateEstado(id, body, scope) {
        return this.service.updateEstadoEntrega(id, body.estado, body.notas, scope);
    }
    getConfig(scope) {
        return this.service.getConfig(scope);
    }
    upsertConfig(data, scope) {
        return this.service.upsertConfig(data, scope);
    }
    getMetricas(scope, desde, hasta) {
        return this.service.getMetricas(scope, desde, hasta);
    }
    getLogNotif(scope, pedido_id) {
        return this.service.getLogNotif(scope, pedido_id ? parseInt(pedido_id) : undefined);
    }
};
exports.LogisticaController = LogisticaController;
__decorate([
    (0, common_1.Get)('repartidores'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "getRepartidores", null);
__decorate([
    (0, common_1.Post)('repartidores'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "createRepartidor", null);
__decorate([
    (0, common_1.Put)('repartidores/:id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "updateRepartidor", null);
__decorate([
    (0, common_1.Patch)('repartidores/:id/toggle'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "toggleRepartidor", null);
__decorate([
    (0, common_1.Post)('asignar'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "asignar", null);
__decorate([
    (0, common_1.Get)('entregas'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "getEntregas", null);
__decorate([
    (0, common_1.Get)('entregas/pedido/:pedido_id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('pedido_id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "getEntregaByPedido", null);
__decorate([
    (0, common_1.Patch)('entregas/:id/estado'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "updateEstado", null);
__decorate([
    (0, common_1.Get)('config'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "upsertConfig", null);
__decorate([
    (0, common_1.Get)('metricas'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('desde')),
    __param(2, (0, common_1.Query)('hasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "getMetricas", null);
__decorate([
    (0, common_1.Get)('notif-log'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('pedido_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LogisticaController.prototype, "getLogNotif", null);
exports.LogisticaController = LogisticaController = __decorate([
    (0, common_1.Controller)('logistica'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [logistica_service_1.LogisticaService])
], LogisticaController);
//# sourceMappingURL=logistica.controller.js.map