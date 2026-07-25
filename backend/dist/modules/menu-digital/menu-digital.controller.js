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
exports.MenuDigitalController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const menu_digital_service_1 = require("./menu-digital.service");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
let MenuDigitalController = class MenuDigitalController {
    constructor(service) {
        this.service = service;
    }
    getStatus(tiendaId, req) {
        return this.service.getStatus(tiendaId, req.user);
    }
    updateConfig(tiendaId, dto, req) {
        return this.service.updateConfig(tiendaId, dto, req.user);
    }
    regenerateKey(tiendaId, req) {
        return this.service.regenerateApiKey(tiendaId, req.user);
    }
    async publish(tiendaId, req) {
        try {
            return await this.service.publish(tiendaId, req.user);
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    getLogs(tiendaId) {
        return this.service.getLogs(tiendaId);
    }
    getPendingOrders(tiendaId, scope) {
        return this.service.getPendingOrders(tiendaId, scope);
    }
    updateOrderStatus(orderId, status, scope) {
        return this.service.updateOrderStatus(orderId, status, scope);
    }
    receive(dto) {
        return this.service.receiveSnapshot(dto);
    }
    receiveImage(dto) {
        return this.service.receiveImage(dto);
    }
    getServerInfo() {
        return this.service.getServerInfo();
    }
    getPublicMenu(slug) {
        return this.service.getPublicMenu(slug);
    }
    createOrder(slug, dto) {
        return this.service.createOrder(slug, dto);
    }
    getOrderStatus(token) {
        return this.service.getOrderStatus(token);
    }
};
exports.MenuDigitalController = MenuDigitalController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('config/:tienda_id'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "getStatus", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Put)('config/:tienda_id'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('config/:tienda_id/regenerate-key'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "regenerateKey", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('publish/:tienda_id'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MenuDigitalController.prototype, "publish", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('logs/:tienda_id'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "getLogs", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('orders/:tienda_id'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "getPendingOrders", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)('orders/:order_id/status'),
    __param(0, (0, common_1.Param)('order_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Post)('receive'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "receive", null);
__decorate([
    (0, common_1.Post)('receive-image'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "receiveImage", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('server-info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "getServerInfo", null);
__decorate([
    (0, common_1.Get)('view/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "getPublicMenu", null);
__decorate([
    (0, common_1.Post)('view/:slug/order'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('order-status/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MenuDigitalController.prototype, "getOrderStatus", null);
exports.MenuDigitalController = MenuDigitalController = __decorate([
    (0, common_1.Controller)('menu-digital'),
    __metadata("design:paramtypes", [menu_digital_service_1.MenuDigitalService])
], MenuDigitalController);
//# sourceMappingURL=menu-digital.controller.js.map