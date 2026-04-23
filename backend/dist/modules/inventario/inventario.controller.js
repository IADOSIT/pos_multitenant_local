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
exports.InventarioController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const platform_express_1 = require("@nestjs/platform-express");
const inventario_service_1 = require("./inventario.service");
let InventarioController = class InventarioController {
    constructor(service) {
        this.service = service;
    }
    listStock(scope) {
        return this.service.listStock(scope);
    }
    listMovimientos(scope) {
        return this.service.listMovimientos(scope);
    }
    getMovimientos(id, scope) {
        return this.service.getMovimientos(id, scope);
    }
    registrarMovimiento(data, scope) {
        return this.service.registrarMovimiento(data, scope);
    }
    updateProducto(id, data, scope) {
        return this.service.updateProducto(id, data, scope);
    }
    csvTemplate(res) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=inventario_template.csv');
        res.send('\uFEFF' + this.service.getCSVTemplate());
    }
    async csvExport(scope, res) {
        const csv = await this.service.exportCSV(scope);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=inventario_export.csv');
        res.send('\uFEFF' + csv);
    }
    csvImport(file, scope) {
        return this.service.importCSV(file.buffer, scope);
    }
    listStockPorModulo(scope, modulo) {
        return this.service.listStockPorModulo(scope, modulo);
    }
};
exports.InventarioController = InventarioController;
__decorate([
    (0, common_1.Get)('stock'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "listStock", null);
__decorate([
    (0, common_1.Get)('movimientos'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "listMovimientos", null);
__decorate([
    (0, common_1.Get)('movimientos/:productoId'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('productoId', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "getMovimientos", null);
__decorate([
    (0, common_1.Post)('movimiento'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "registrarMovimiento", null);
__decorate([
    (0, common_1.Put)('producto/:id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "updateProducto", null);
__decorate([
    (0, common_1.Get)('csv/template'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "csvTemplate", null);
__decorate([
    (0, common_1.Get)('csv/export'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "csvExport", null);
__decorate([
    (0, common_1.Post)('csv/import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "csvImport", null);
__decorate([
    (0, common_1.Get)('stock-modulo'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager', 'cajero', 'mesero'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('modulo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "listStockPorModulo", null);
exports.InventarioController = InventarioController = __decorate([
    (0, common_1.Controller)('inventario'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __metadata("design:paramtypes", [inventario_service_1.InventarioService])
], InventarioController);
//# sourceMappingURL=inventario.controller.js.map