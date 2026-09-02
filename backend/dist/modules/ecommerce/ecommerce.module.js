"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcommerceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ecommerce_config_entity_1 = require("./ecommerce-config.entity");
const ecommerce_pedido_entity_1 = require("./ecommerce-pedido.entity");
const ecommerce_producto_config_entity_1 = require("./ecommerce-producto-config.entity");
const cliente_entity_1 = require("./cliente.entity");
const ecommerce_service_1 = require("./ecommerce.service");
const ecommerce_controller_1 = require("./ecommerce.controller");
const ecommerce_public_controller_1 = require("./ecommerce-public.controller");
const pedidos_module_1 = require("../pedidos/pedidos.module");
let EcommerceModule = class EcommerceModule {
};
exports.EcommerceModule = EcommerceModule;
exports.EcommerceModule = EcommerceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([ecommerce_config_entity_1.EcommerceConfig, ecommerce_pedido_entity_1.EcommercePedido, ecommerce_producto_config_entity_1.EcommerceProductoConfig, cliente_entity_1.Cliente]),
            pedidos_module_1.PedidosModule,
        ],
        controllers: [ecommerce_controller_1.EcommerceController, ecommerce_public_controller_1.EcommercePublicController],
        providers: [ecommerce_service_1.EcommerceService],
        exports: [ecommerce_service_1.EcommerceService],
    })
], EcommerceModule);
//# sourceMappingURL=ecommerce.module.js.map