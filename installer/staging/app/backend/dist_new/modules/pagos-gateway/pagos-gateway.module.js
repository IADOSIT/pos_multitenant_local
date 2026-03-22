"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagosGatewayModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const gateway_config_entity_1 = require("./gateway-config.entity");
const gateway_transaccion_entity_1 = require("./gateway-transaccion.entity");
const pagos_gateway_controller_1 = require("./pagos-gateway.controller");
const pagos_gateway_service_1 = require("./pagos-gateway.service");
let PagosGatewayModule = class PagosGatewayModule {
};
exports.PagosGatewayModule = PagosGatewayModule;
exports.PagosGatewayModule = PagosGatewayModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([gateway_config_entity_1.GatewayConfig, gateway_transaccion_entity_1.GatewayTransaccion])],
        controllers: [pagos_gateway_controller_1.PagosGatewayController, pagos_gateway_controller_1.PagosGatewayWebhookController],
        providers: [pagos_gateway_service_1.PagosGatewayService],
        exports: [pagos_gateway_service_1.PagosGatewayService],
    })
], PagosGatewayModule);
//# sourceMappingURL=pagos-gateway.module.js.map