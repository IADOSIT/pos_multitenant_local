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
exports.PerfilesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const perfiles_service_1 = require("./perfiles.service");
let PerfilesController = class PerfilesController {
    constructor(service) {
        this.service = service;
    }
    getActivo(scope) {
        return this.service.getPerfilActivo(scope.tenant_id);
    }
    activar(body, scope) {
        return this.service.activarPerfil(scope.tenant_id, scope.empresa_id, scope.tienda_id, body.perfil_clave, scope);
    }
    desactivar(clave, scope) {
        return this.service.desactivarPerfil(scope.tenant_id, clave);
    }
    alertasStock(scope, modulo) {
        return this.service.getAlertasStock(scope.tenant_id, scope.empresa_id, modulo);
    }
    resumenModulo(modulo, scope) {
        return this.service.getResumenModulo(scope.tenant_id, scope.empresa_id, modulo);
    }
};
exports.PerfilesController = PerfilesController;
__decorate([
    (0, common_1.Get)('activo'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero', 'mesero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PerfilesController.prototype, "getActivo", null);
__decorate([
    (0, common_1.Post)('activar'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerfilesController.prototype, "activar", null);
__decorate([
    (0, common_1.Delete)('desactivar/:clave'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('clave')),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PerfilesController.prototype, "desactivar", null);
__decorate([
    (0, common_1.Get)('alertas-stock'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero', 'mesero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('modulo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PerfilesController.prototype, "alertasStock", null);
__decorate([
    (0, common_1.Get)('resumen/:modulo'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, common_1.Param)('modulo')),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PerfilesController.prototype, "resumenModulo", null);
exports.PerfilesController = PerfilesController = __decorate([
    (0, common_1.Controller)('perfiles'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [perfiles_service_1.PerfilesService])
], PerfilesController);
//# sourceMappingURL=perfiles.controller.js.map