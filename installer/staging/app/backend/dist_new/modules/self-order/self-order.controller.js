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
exports.SelfOrderController = exports.SelfOrderPublicController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const self_order_service_1 = require("./self-order.service");
let SelfOrderPublicController = class SelfOrderPublicController {
    constructor(service) {
        this.service = service;
    }
    getTiendaBySlug(slug, mesa_numero) {
        return this.service.getTiendaPublicaBySlug(slug, mesa_numero);
    }
    getMenuBySlug(slug) {
        return this.service.getMenuPublicoBySlug(slug);
    }
    crearPedidoBySlug(slug, mesa_numero, body) {
        return this.service.crearPedidoBySlug(slug, mesa_numero, body);
    }
    getTiendaPublica(tienda_id, mesa_numero) {
        return this.service.getTiendaPublica(tienda_id, mesa_numero);
    }
    getMenuPublico(tienda_id) {
        return this.service.getMenuPublico(tienda_id);
    }
    crearPedido(tienda_id, mesa_numero, body) {
        return this.service.crearPedidoCliente(tienda_id, mesa_numero, body);
    }
    getEstado(token) {
        return this.service.getEstadoPedido(token);
    }
    responderEncuesta(token, body) {
        return this.service.responderEncuesta(token, body);
    }
    async printQR(tienda_id, mesa_id, baseParam, req, res) {
        const baseUrl = baseParam ? decodeURIComponent(baseParam) : `${req.protocol}://${req.get('host')}`;
        const html = await this.service.getQRPrintable(tienda_id, mesa_id, baseUrl);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }
};
exports.SelfOrderPublicController = SelfOrderPublicController;
__decorate([
    (0, common_1.Get)('s/:slug/:mesa_numero'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('mesa_numero', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], SelfOrderPublicController.prototype, "getTiendaBySlug", null);
__decorate([
    (0, common_1.Get)('s/:slug/menu/productos'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SelfOrderPublicController.prototype, "getMenuBySlug", null);
__decorate([
    (0, common_1.Post)('s/:slug/:mesa_numero/pedido'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('mesa_numero', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], SelfOrderPublicController.prototype, "crearPedidoBySlug", null);
__decorate([
    (0, common_1.Get)(':tienda_id/:mesa_numero'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('mesa_numero', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], SelfOrderPublicController.prototype, "getTiendaPublica", null);
__decorate([
    (0, common_1.Get)(':tienda_id/menu/productos'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SelfOrderPublicController.prototype, "getMenuPublico", null);
__decorate([
    (0, common_1.Post)(':tienda_id/:mesa_numero/pedido'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('mesa_numero', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", void 0)
], SelfOrderPublicController.prototype, "crearPedido", null);
__decorate([
    (0, common_1.Get)('status/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SelfOrderPublicController.prototype, "getEstado", null);
__decorate([
    (0, common_1.Post)('encuesta/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SelfOrderPublicController.prototype, "responderEncuesta", null);
__decorate([
    (0, common_1.Get)('qr/:tienda_id/:mesa_id'),
    __param(0, (0, common_1.Param)('tienda_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('mesa_id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('base')),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SelfOrderPublicController.prototype, "printQR", null);
exports.SelfOrderPublicController = SelfOrderPublicController = __decorate([
    (0, common_1.Controller)('public/self-order'),
    __metadata("design:paramtypes", [self_order_service_1.SelfOrderService])
], SelfOrderPublicController);
let SelfOrderController = class SelfOrderController {
    constructor(service) {
        this.service = service;
    }
    confirmarPedido(id, scope) {
        return this.service.confirmarPedidoMesero(id, scope);
    }
    rechazarPedido(id, body, scope) {
        return this.service.rechazarPedido(id, body.motivo || 'Sin motivo', scope);
    }
    getKPIs(scope, desde, hasta) {
        return this.service.getKPIs(scope, desde, hasta);
    }
};
exports.SelfOrderController = SelfOrderController;
__decorate([
    (0, common_1.Post)('pedidos/:id/confirmar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SelfOrderController.prototype, "confirmarPedido", null);
__decorate([
    (0, common_1.Post)('pedidos/:id/rechazar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantScope)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], SelfOrderController.prototype, "rechazarPedido", null);
__decorate([
    (0, common_1.Get)('kpis'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('desde')),
    __param(2, (0, common_1.Query)('hasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SelfOrderController.prototype, "getKPIs", null);
exports.SelfOrderController = SelfOrderController = __decorate([
    (0, common_1.Controller)('self-order'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [self_order_service_1.SelfOrderService])
], SelfOrderController);
//# sourceMappingURL=self-order.controller.js.map