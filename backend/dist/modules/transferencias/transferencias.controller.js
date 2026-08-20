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
exports.TransferenciasController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const transferencias_service_1 = require("./transferencias.service");
let TransferenciasController = class TransferenciasController {
    constructor(service) {
        this.service = service;
    }
    crear(data, scope) {
        if (!data?.tienda_destino_id || !data?.producto_id || !data?.cantidad) {
            throw new common_1.BadRequestException('Faltan datos de la transferencia');
        }
        return this.service.crear(data, scope);
    }
    listPendientesRecibir(scope) {
        return this.service.listPendientesRecibir(scope);
    }
    listEnviadas(scope) {
        return this.service.listEnviadas(scope);
    }
    buscarPorFolio(folio, scope) {
        return this.service.buscarPorFolio(folio, scope);
    }
    recibir(id, scope) {
        return this.service.recibir(id, scope);
    }
    cancelar(id, body, scope) {
        if (!body?.motivo)
            throw new common_1.BadRequestException('Indica el motivo de la cancelacion');
        return this.service.cancelar(id, body.motivo, scope);
    }
};
exports.TransferenciasController = TransferenciasController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransferenciasController.prototype, "crear", null);
__decorate([
    (0, common_1.Get)('pendientes-recibir'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransferenciasController.prototype, "listPendientesRecibir", null);
__decorate([
    (0, common_1.Get)('enviadas'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransferenciasController.prototype, "listEnviadas", null);
__decorate([
    (0, common_1.Get)('folio/:folio'),
    __param(0, (0, common_1.Param)('folio')),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransferenciasController.prototype, "buscarPorFolio", null);
__decorate([
    (0, common_1.Post)(':id/recibir'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], TransferenciasController.prototype, "recibir", null);
__decorate([
    (0, common_1.Post)(':id/cancelar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], TransferenciasController.prototype, "cancelar", null);
exports.TransferenciasController = TransferenciasController = __decorate([
    (0, common_1.Controller)('transferencias'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [transferencias_service_1.TransferenciasService])
], TransferenciasController);
//# sourceMappingURL=transferencias.controller.js.map