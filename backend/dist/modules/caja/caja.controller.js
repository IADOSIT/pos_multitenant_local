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
exports.CajaController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const caja_service_1 = require("./caja.service");
let CajaController = class CajaController {
    constructor(service) {
        this.service = service;
    }
    abrir(data, scope) {
        return this.service.abrir(data, scope);
    }
    cerrar(id, data, scope) {
        return this.service.cerrar(id, data, scope);
    }
    movimiento(id, data, scope) {
        return this.service.movimiento(id, data, scope);
    }
    corteX(id) {
        return this.service.corteX(id);
    }
    reporte(id) {
        return this.service.reporteCaja(id);
    }
    getActiva(scope) {
        return this.service.getActiva(scope);
    }
    findAll(scope) {
        return this.service.findAll(scope);
    }
};
exports.CajaController = CajaController;
__decorate([
    (0, common_1.Post)('abrir'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "abrir", null);
__decorate([
    (0, common_1.Post)(':id/cerrar'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "cerrar", null);
__decorate([
    (0, common_1.Post)(':id/movimiento'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "movimiento", null);
__decorate([
    (0, common_1.Get)(':id/corte-x'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "corteX", null);
__decorate([
    (0, common_1.Get)(':id/reporte'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "reporte", null);
__decorate([
    (0, common_1.Get)('activa'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "getActiva", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "findAll", null);
exports.CajaController = CajaController = __decorate([
    (0, common_1.Controller)('caja'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [caja_service_1.CajaService])
], CajaController);
//# sourceMappingURL=caja.controller.js.map