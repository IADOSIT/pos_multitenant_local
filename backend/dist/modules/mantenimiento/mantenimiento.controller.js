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
exports.MantenimientoController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const mantenimiento_service_1 = require("./mantenimiento.service");
let MantenimientoController = class MantenimientoController {
    constructor(svc) {
        this.svc = svc;
    }
    estado() {
        return this.svc.estado();
    }
    respaldos() {
        return { respaldos: this.svc.listarRespaldos() };
    }
    trabajo(id) {
        return this.svc.trabajo(id);
    }
    respaldar(body) {
        return this.svc.respaldar(body?.etiqueta || 'manual', {
            sinExcel: !!body?.sin_excel,
            sinImagenes: !!body?.sin_imagenes,
        });
    }
    excel() {
        return this.svc.exportarExcel();
    }
    imagenes(body) {
        return this.svc.imagenes(!!body?.arreglar);
    }
    ajustes() {
        return this.svc.ajustes();
    }
    revertir(body) {
        return this.svc.revertir(body?.respaldo);
    }
    buscarActualizacion() {
        return this.svc.buscarActualizacion();
    }
    actualizar(body) {
        return this.svc.actualizar(body || {});
    }
};
exports.MantenimientoController = MantenimientoController;
__decorate([
    (0, common_1.Get)('estado'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "estado", null);
__decorate([
    (0, common_1.Get)('respaldos'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "respaldos", null);
__decorate([
    (0, common_1.Get)('trabajo/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "trabajo", null);
__decorate([
    (0, common_1.Post)('respaldar'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "respaldar", null);
__decorate([
    (0, common_1.Post)('excel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "excel", null);
__decorate([
    (0, common_1.Post)('imagenes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "imagenes", null);
__decorate([
    (0, common_1.Post)('ajustes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "ajustes", null);
__decorate([
    (0, common_1.Post)('revertir'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "revertir", null);
__decorate([
    (0, common_1.Get)('actualizacion'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "buscarActualizacion", null);
__decorate([
    (0, common_1.Post)('actualizar'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MantenimientoController.prototype, "actualizar", null);
exports.MantenimientoController = MantenimientoController = __decorate([
    (0, common_1.Controller)('mantenimiento'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __metadata("design:paramtypes", [mantenimiento_service_1.MantenimientoService])
], MantenimientoController);
//# sourceMappingURL=mantenimiento.controller.js.map