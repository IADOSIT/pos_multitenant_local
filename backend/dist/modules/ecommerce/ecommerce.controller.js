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
exports.EcommerceController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const ecommerce_service_1 = require("./ecommerce.service");
let EcommerceController = class EcommerceController {
    constructor(service, dataSource) {
        this.service = service;
        this.dataSource = dataSource;
    }
    getConfig(scope) {
        return this.service.getConfig(scope);
    }
    upsertConfig(scope, body) {
        return this.service.upsertConfig(scope, body);
    }
    verificarSubdominio(scope, sub) {
        return this.service.verificarSubdominio(sub, scope.empresa_id);
    }
    generarSubdominio(nombre) {
        return this.service.generarSubdominioUnico(nombre);
    }
    getTemas() {
        return this.service.getTemas();
    }
    getProductosEcommerce(scope, query) {
        return this.service.getPublicProductos('', this.dataSource, { ...query, _scope: scope });
    }
    getProductoConfig(id) {
        return this.service.getProductoConfig(id);
    }
    upsertProductoConfig(scope, id, body) {
        return this.service.upsertProductoConfig(scope, id, body);
    }
    bulkVisibilidad(scope, body) {
        return this.service.bulkVisibilidad(scope, body.ids, body.visible);
    }
    listPedidos(scope, query) {
        return this.service.listPedidos(scope, query);
    }
    getPedido(scope, id) {
        return this.service.getPedido(scope, id);
    }
    updateEstado(scope, id, body) {
        return this.service.updateEstadoPedido(scope, id, body.estado, body.notas_internas);
    }
    deletePedido(scope, id) {
        return this.service.deletePedido(scope, id);
    }
};
exports.EcommerceController = EcommerceController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "upsertConfig", null);
__decorate([
    (0, common_1.Get)('config/verificar-subdominio'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('subdominio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "verificarSubdominio", null);
__decorate([
    (0, common_1.Post)('config/generar-subdominio'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, common_1.Body)('nombre')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "generarSubdominio", null);
__decorate([
    (0, common_1.Get)('config/temas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "getTemas", null);
__decorate([
    (0, common_1.Get)('productos'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "getProductosEcommerce", null);
__decorate([
    (0, common_1.Get)('productos/:id/config'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "getProductoConfig", null);
__decorate([
    (0, common_1.Put)('productos/:id/config'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "upsertProductoConfig", null);
__decorate([
    (0, common_1.Post)('productos/bulk-visibilidad'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "bulkVisibilidad", null);
__decorate([
    (0, common_1.Get)('pedidos'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "listPedidos", null);
__decorate([
    (0, common_1.Get)('pedidos/:id'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "getPedido", null);
__decorate([
    (0, common_1.Put)('pedidos/:id/estado'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin', 'manager'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "updateEstado", null);
__decorate([
    (0, common_1.Delete)('pedidos/:id'),
    (0, roles_decorator_1.Roles)('superadmin', 'admin'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EcommerceController.prototype, "deletePedido", null);
exports.EcommerceController = EcommerceController = __decorate([
    (0, common_1.Controller)('ecommerce'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [ecommerce_service_1.EcommerceService,
        typeorm_2.DataSource])
], EcommerceController);
//# sourceMappingURL=ecommerce.controller.js.map