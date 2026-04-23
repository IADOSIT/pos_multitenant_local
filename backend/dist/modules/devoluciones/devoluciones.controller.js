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
exports.DevolucionesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const devoluciones_service_1 = require("./devoluciones.service");
let DevolucionesController = class DevolucionesController {
    constructor(service) {
        this.service = service;
    }
    checkPermiso(scope) {
        const cp = scope.config_pos || {};
        const rol = cp.devoluciones_rol || 'admin';
        const userRol = scope.rol;
        if (rol === 'cajero')
            return;
        if (['admin', 'superadmin', 'manager'].includes(userRol))
            return;
        throw new common_1.ForbiddenException('No tienes permiso para realizar devoluciones');
    }
    findAll(req, desde, hasta) {
        return this.service.findAll(req.user, desde, hasta);
    }
    findByVenta(ventaId, req) {
        return this.service.findByVenta(Number(ventaId), req.user);
    }
    findOne(id, req) {
        return this.service.findOne(Number(id), req.user);
    }
    crear(body, req) {
        this.checkPermiso(req.user);
        return this.service.crear(body, req.user);
    }
};
exports.DevolucionesController = DevolucionesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('desde')),
    __param(2, (0, common_1.Query)('hasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DevolucionesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('venta/:ventaId'),
    __param(0, (0, common_1.Param)('ventaId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevolucionesController.prototype, "findByVenta", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevolucionesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DevolucionesController.prototype, "crear", null);
exports.DevolucionesController = DevolucionesController = __decorate([
    (0, common_1.Controller)('devoluciones'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [devoluciones_service_1.DevolucionesService])
], DevolucionesController);
//# sourceMappingURL=devoluciones.controller.js.map