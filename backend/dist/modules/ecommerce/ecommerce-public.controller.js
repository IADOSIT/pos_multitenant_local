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
exports.EcommercePublicController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ecommerce_service_1 = require("./ecommerce.service");
let EcommercePublicController = class EcommercePublicController {
    constructor(service, dataSource) {
        this.service = service;
        this.dataSource = dataSource;
    }
    getInfo(sub) {
        return this.service.getPublicInfo(sub, this.dataSource);
    }
    getCategorias(sub) {
        return this.service.getPublicCategorias(sub, this.dataSource);
    }
    getProductos(sub, query) {
        return this.service.getPublicProductos(sub, this.dataSource, query);
    }
    getProducto(sub, slug) {
        return this.service.getPublicProductoBySlug(sub, slug, this.dataSource);
    }
    crearPedido(sub, body) {
        return this.service.crearPedidoPublico(sub, body, this.dataSource);
    }
    trackPedido(sub, numero) {
        return this.service.getPublicPedido(sub, numero, this.dataSource);
    }
};
exports.EcommercePublicController = EcommercePublicController;
__decorate([
    (0, common_1.Get)(':subdominio/info'),
    __param(0, (0, common_1.Param)('subdominio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EcommercePublicController.prototype, "getInfo", null);
__decorate([
    (0, common_1.Get)(':subdominio/categorias'),
    __param(0, (0, common_1.Param)('subdominio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EcommercePublicController.prototype, "getCategorias", null);
__decorate([
    (0, common_1.Get)(':subdominio/productos'),
    __param(0, (0, common_1.Param)('subdominio')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EcommercePublicController.prototype, "getProductos", null);
__decorate([
    (0, common_1.Get)(':subdominio/productos/:slug'),
    __param(0, (0, common_1.Param)('subdominio')),
    __param(1, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EcommercePublicController.prototype, "getProducto", null);
__decorate([
    (0, common_1.Post)(':subdominio/pedidos'),
    __param(0, (0, common_1.Param)('subdominio')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EcommercePublicController.prototype, "crearPedido", null);
__decorate([
    (0, common_1.Get)(':subdominio/pedidos/:numero'),
    __param(0, (0, common_1.Param)('subdominio')),
    __param(1, (0, common_1.Param)('numero')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EcommercePublicController.prototype, "trackPedido", null);
exports.EcommercePublicController = EcommercePublicController = __decorate([
    (0, common_1.Controller)('public/tienda'),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [ecommerce_service_1.EcommerceService,
        typeorm_2.DataSource])
], EcommercePublicController);
//# sourceMappingURL=ecommerce-public.controller.js.map