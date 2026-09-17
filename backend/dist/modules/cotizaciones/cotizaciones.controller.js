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
exports.CotizacionesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const cotizaciones_service_1 = require("./cotizaciones.service");
let CotizacionesController = class CotizacionesController {
    constructor(service) {
        this.service = service;
    }
    listar(scope, query) {
        return this.service.listar(scope, { estado: query.estado, q: query.q });
    }
    detalle(scope, id) {
        return this.service.detalle(scope, id);
    }
    cotizar(scope, id, dto) {
        return this.service.cotizar(scope, id, dto);
    }
    cerrar(scope, id, body) {
        return this.service.cerrar(scope, id, body?.motivo);
    }
    notas(scope, id, body) {
        return this.service.actualizarNotas(scope, id, body?.notas_internas);
    }
};
exports.CotizacionesController = CotizacionesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "detalle", null);
__decorate([
    (0, common_1.Post)(':id/cotizar'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "cotizar", null);
__decorate([
    (0, common_1.Post)(':id/cerrar'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "cerrar", null);
__decorate([
    (0, common_1.Patch)(':id/notas'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], CotizacionesController.prototype, "notas", null);
exports.CotizacionesController = CotizacionesController = __decorate([
    (0, common_1.Controller)('cotizaciones'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [cotizaciones_service_1.CotizacionesService])
], CotizacionesController);
//# sourceMappingURL=cotizaciones.controller.js.map