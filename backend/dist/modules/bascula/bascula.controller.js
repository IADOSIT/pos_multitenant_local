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
exports.BasculaController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const bascula_service_1 = require("./bascula.service");
let BasculaController = class BasculaController {
    constructor(service) {
        this.service = service;
    }
    getConfig(tiendaId, req) {
        return this.service.getOrCreateConfig(tiendaId, req.user);
    }
    updateConfig(tiendaId, dto, req) {
        return this.service.updateConfig(tiendaId, dto, req.user);
    }
    regenerateToken(tiendaId, req) {
        return this.service.regenerateToken(tiendaId, req.user);
    }
    getProductos(tiendaId, req) {
        return this.service.getProductosPorPeso(tiendaId, req.user);
    }
    registrarPesaje(dto, req) {
        return this.service.registrarPesaje(dto, req.user);
    }
};
exports.BasculaController = BasculaController;
__decorate([
    (0, common_1.Get)('config/:tienda_id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero', 'mesero'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], BasculaController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config/:tienda_id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], BasculaController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Post)('config/:tienda_id/regenerate-token'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], BasculaController.prototype, "regenerateToken", null);
__decorate([
    (0, common_1.Get)('productos/:tienda_id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero', 'mesero'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], BasculaController.prototype, "getProductos", null);
__decorate([
    (0, common_1.Post)('pesaje'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero', 'mesero'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BasculaController.prototype, "registrarPesaje", null);
exports.BasculaController = BasculaController = __decorate([
    (0, common_1.Controller)('bascula'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [bascula_service_1.BasculaService])
], BasculaController);
//# sourceMappingURL=bascula.controller.js.map