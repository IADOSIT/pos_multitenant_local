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
exports.ProductosController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const productos_service_1 = require("./productos.service");
let ProductosController = class ProductosController {
    constructor(service) {
        this.service = service;
        this.logger = new common_1.Logger('ProductosController');
    }
    findAll(scope, catId) {
        return this.service.findAll(scope, catId ? parseInt(catId) : undefined);
    }
    findForPOS(scope) {
        return this.service.findForPOS(scope);
    }
    downloadTemplate(res) {
        const csv = this.service.getCSVTemplate();
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=productos_template.csv');
        res.send('\uFEFF' + csv);
    }
    searchImages(query) {
        return this.service.searchImages(query);
    }
    getIaImagenesConfig(scope) {
        return this.service.getIaImagenesConfig(scope.empresa_id);
    }
    saveIaImagenesConfig(data, scope) {
        return this.service.saveIaImagenesConfig(scope, data);
    }
    async generateImage(body, scope) {
        if (!body?.prompt)
            throw new common_1.BadRequestException('Falta la descripcion del producto');
        return this.service.generateImage(scope, body.prompt);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(data, scope) {
        return this.service.create({ ...data, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id });
    }
    async importCSV(file, scope, update) {
        try {
            if (!file)
                throw new common_1.BadRequestException('No se recibió ningún archivo');
            return await this.service.importCSV(file.buffer, scope, update === 'true');
        }
        catch (err) {
            this.logger.error(`CSV import error: ${err?.message}`, err?.stack);
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException(err?.message || 'Error procesando el CSV');
        }
    }
    async uploadImage(file) {
        try {
            if (!file)
                throw new common_1.BadRequestException('No se recibió ningún archivo');
            const url = await this.service.uploadImage(file);
            return url;
        }
        catch (err) {
            this.logger.error(`Image upload error: ${err?.message}`, err?.stack);
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException(err?.message || 'Error al subir imagen');
        }
    }
    update(id, data) {
        return this.service.update(id, data);
    }
    purge(scope) {
        return this.service.purgeInactive(scope);
    }
    reassignBySkuPrefix(body) {
        return this.service.reassignBySkuPrefix(body.prefixes, body.target_tenant_id, body.target_empresa_id);
    }
    delete(id) {
        return this.service.deleteProduct(id);
    }
};
exports.ProductosController = ProductosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('categoria_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('pos'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "findForPOS", null);
__decorate([
    (0, common_1.Get)('csv/template'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "downloadTemplate", null);
__decorate([
    (0, common_1.Get)('image-search'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "searchImages", null);
__decorate([
    (0, common_1.Get)('ia-imagenes-config'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "getIaImagenesConfig", null);
__decorate([
    (0, common_1.Put)('ia-imagenes-config'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "saveIaImagenesConfig", null);
__decorate([
    (0, common_1.Post)('generate-image'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProductosController.prototype, "generateImage", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('csv/import'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __param(2, (0, common_1.Query)('update')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ProductosController.prototype, "importCSV", null);
__decorate([
    (0, common_1.Post)('upload-image'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductosController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('purge-inactive'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "purge", null);
__decorate([
    (0, common_1.Post)('reassign-by-sku-prefix'),
    (0, roles_decorator_1.Roles)('superadmin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "reassignBySkuPrefix", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "delete", null);
exports.ProductosController = ProductosController = __decorate([
    (0, common_1.Controller)('productos'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [productos_service_1.ProductosService])
], ProductosController);
//# sourceMappingURL=productos.controller.js.map