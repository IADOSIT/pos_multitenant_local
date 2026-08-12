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
exports.TicketsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const tickets_service_1 = require("./tickets.service");
let TicketsController = class TicketsController {
    constructor(service) {
        this.service = service;
    }
    getConfig(scope) {
        return this.service.getConfig(scope.tenant_id, scope.empresa_id, scope.tienda_id);
    }
    saveConfig(data) {
        return this.service.saveConfig(data);
    }
    updateConfig(id, data) {
        return this.service.updateConfig(id, data);
    }
    async uploadLogo(file) {
        const { saveUploadedImage } = await Promise.resolve().then(() => require('../../common/utils/upload-image.util'));
        const logoUrl = await saveUploadedImage(file, 'logo-ticket');
        return { logo_url: logoUrl };
    }
    async preview(data, scope) {
        const config = await this.service.getConfig(scope.tenant_id, scope.empresa_id, scope.tienda_id);
        const ticket = this.service.generateTicketData(data.venta, config);
        return {
            ...ticket,
            ancho_papel: config.ancho_papel ?? 80,
            fuente_familia: config.fuente_familia ?? 'Courier New',
            fuente_tamano: config.fuente_tamano ?? 9,
            logo_posicion: config.logo_posicion ?? 'centro',
            logo_url: config.mostrar_logo ? config.logo_url : null,
            copias: config.copias ?? 1,
            impresion_enabled: config.impresion_enabled !== false,
            modo_impresion: config.modo_impresion ?? 'navegador',
        };
    }
    async precuenta(data, scope) {
        const config = await this.service.getConfig(scope.tenant_id, scope.empresa_id, scope.tienda_id);
        const ticket = this.service.generatePreCuentaData(data, config);
        return {
            ...ticket,
            ancho_papel: config.ancho_papel ?? 80,
            fuente_familia: config.fuente_familia ?? 'Courier New',
            fuente_tamano: config.fuente_tamano ?? 9,
            logo_posicion: config.logo_posicion ?? 'centro',
            logo_url: config.mostrar_logo ? config.logo_url : null,
            copias: 1,
            impresion_enabled: true,
            modo_impresion: config.modo_impresion ?? 'navegador',
        };
    }
};
exports.TicketsController = TicketsController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "saveConfig", null);
__decorate([
    (0, common_1.Put)('config/:id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Post)('upload-logo'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Post)('preview'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)('precuenta'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "precuenta", null);
exports.TicketsController = TicketsController = __decorate([
    (0, common_1.Controller)('tickets'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService])
], TicketsController);
//# sourceMappingURL=tickets.controller.js.map