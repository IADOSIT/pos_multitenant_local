"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CajaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const caja_entity_1 = require("./caja.entity");
const venta_entity_1 = require("../ventas/venta.entity");
const auditoria_entity_1 = require("../ventas/auditoria.entity");
const ecommerce_pedido_entity_1 = require("../ecommerce/ecommerce-pedido.entity");
const caja_controller_1 = require("./caja.controller");
const caja_service_1 = require("./caja.service");
let CajaModule = class CajaModule {
};
exports.CajaModule = CajaModule;
exports.CajaModule = CajaModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([caja_entity_1.Caja, caja_entity_1.MovimientoCaja, venta_entity_1.Venta, auditoria_entity_1.Auditoria, ecommerce_pedido_entity_1.EcommercePedido])],
        controllers: [caja_controller_1.CajaController],
        providers: [caja_service_1.CajaService],
        exports: [caja_service_1.CajaService],
    })
], CajaModule);
//# sourceMappingURL=caja.module.js.map