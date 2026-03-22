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
exports.PagosGatewayWebhookController = exports.PagosGatewayController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const pagos_gateway_service_1 = require("./pagos-gateway.service");
let PagosGatewayController = class PagosGatewayController {
    constructor(service) {
        this.service = service;
    }
    getConfig(tiendaId) {
        return this.service.getConfig(tiendaId);
    }
    saveConfig(body, tiendaId) {
        return this.service.saveConfig(tiendaId, body);
    }
    crearQrMP(body, tiendaId) {
        return this.service.crearQrMP(tiendaId, body);
    }
    getEstadoMP(externalId, tiendaId) {
        return this.service.getEstadoMP(tiendaId, externalId);
    }
    crearPointMP(body, tiendaId) {
        return this.service.crearPointMP(tiendaId, body);
    }
    getEstadoPoint(intentId, tiendaId) {
        return this.service.getEstadoPoint(tiendaId, intentId);
    }
    crearStripeIntent(body, tiendaId) {
        return this.service.crearStripeIntent(tiendaId, body);
    }
    getEstadoStripe(intentId, tiendaId) {
        return this.service.getEstadoStripe(tiendaId, intentId);
    }
    getTransacciones(limit, tiendaId) {
        return this.service.getTransacciones(tiendaId, limit ? parseInt(limit) : 50);
    }
};
exports.PagosGatewayController = PagosGatewayController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, tenant_decorator_1.TenantScope)('tienda_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PagosGatewayController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)('tienda_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], PagosGatewayController.prototype, "saveConfig", null);
__decorate([
    (0, common_1.Post)('mp/qr'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)('tienda_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], PagosGatewayController.prototype, "crearQrMP", null);
__decorate([
    (0, common_1.Get)('mp/estado/:external_id'),
    __param(0, (0, common_1.Param)('external_id')),
    __param(1, (0, tenant_decorator_1.TenantScope)('tienda_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], PagosGatewayController.prototype, "getEstadoMP", null);
__decorate([
    (0, common_1.Post)('mp/point'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)('tienda_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], PagosGatewayController.prototype, "crearPointMP", null);
__decorate([
    (0, common_1.Get)('mp/point/:intent_id'),
    __param(0, (0, common_1.Param)('intent_id')),
    __param(1, (0, tenant_decorator_1.TenantScope)('tienda_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], PagosGatewayController.prototype, "getEstadoPoint", null);
__decorate([
    (0, common_1.Post)('stripe/intent'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantScope)('tienda_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], PagosGatewayController.prototype, "crearStripeIntent", null);
__decorate([
    (0, common_1.Get)('stripe/estado/:intent_id'),
    __param(0, (0, common_1.Param)('intent_id')),
    __param(1, (0, tenant_decorator_1.TenantScope)('tienda_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], PagosGatewayController.prototype, "getEstadoStripe", null);
__decorate([
    (0, common_1.Get)('transacciones'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, tenant_decorator_1.TenantScope)('tienda_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], PagosGatewayController.prototype, "getTransacciones", null);
exports.PagosGatewayController = PagosGatewayController = __decorate([
    (0, common_1.Controller)('pagos-gateway'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [pagos_gateway_service_1.PagosGatewayService])
], PagosGatewayController);
let PagosGatewayWebhookController = class PagosGatewayWebhookController {
    constructor(service) {
        this.service = service;
    }
    webhookMP(body) {
        return this.service.webhookMP(body);
    }
    webhookStripe(body) {
        return this.service.webhookStripe(body);
    }
};
exports.PagosGatewayWebhookController = PagosGatewayWebhookController;
__decorate([
    (0, common_1.Post)('mp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PagosGatewayWebhookController.prototype, "webhookMP", null);
__decorate([
    (0, common_1.Post)('stripe'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PagosGatewayWebhookController.prototype, "webhookStripe", null);
exports.PagosGatewayWebhookController = PagosGatewayWebhookController = __decorate([
    (0, common_1.Controller)('pagos-gateway/webhook'),
    __metadata("design:paramtypes", [pagos_gateway_service_1.PagosGatewayService])
], PagosGatewayWebhookController);
//# sourceMappingURL=pagos-gateway.controller.js.map