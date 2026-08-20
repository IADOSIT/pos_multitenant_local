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
exports.ApartadosController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const apartados_service_1 = require("./apartados.service");
let ApartadosController = class ApartadosController {
    constructor(service) {
        this.service = service;
    }
    listPendientes(scope) {
        return this.service.listPendientes(scope);
    }
    buscarPorFolio(folio, scope) {
        return this.service.buscarPorFolio(folio, scope);
    }
    entregar(id, scope) {
        return this.service.entregar(id, scope);
    }
    cancelar(id, body, scope) {
        if (!body?.motivo)
            throw new common_1.BadRequestException('Indica el motivo de la cancelacion');
        return this.service.cancelar(id, body.motivo, scope);
    }
};
exports.ApartadosController = ApartadosController;
__decorate([
    (0, common_1.Get)('pendientes'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "listPendientes", null);
__decorate([
    (0, common_1.Get)('folio/:folio'),
    __param(0, (0, common_1.Param)('folio')),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "buscarPorFolio", null);
__decorate([
    (0, common_1.Post)(':id/entregar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "entregar", null);
__decorate([
    (0, common_1.Post)(':id/cancelar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "cancelar", null);
exports.ApartadosController = ApartadosController = __decorate([
    (0, common_1.Controller)('apartados'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [apartados_service_1.ApartadosService])
], ApartadosController);
//# sourceMappingURL=apartados.controller.js.map