"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CotizacionesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cotizacion_entity_1 = require("./cotizacion.entity");
const cotizacion_version_entity_1 = require("./cotizacion-version.entity");
const ecommerce_config_entity_1 = require("../ecommerce/ecommerce-config.entity");
const pedidos_module_1 = require("../pedidos/pedidos.module");
const cotizaciones_controller_1 = require("./cotizaciones.controller");
const cotizaciones_internal_controller_1 = require("./cotizaciones-internal.controller");
const cotizaciones_service_1 = require("./cotizaciones.service");
let CotizacionesModule = class CotizacionesModule {
};
exports.CotizacionesModule = CotizacionesModule;
exports.CotizacionesModule = CotizacionesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([cotizacion_entity_1.Cotizacion, cotizacion_version_entity_1.CotizacionVersion, ecommerce_config_entity_1.EcommerceConfig]),
            pedidos_module_1.PedidosModule,
        ],
        controllers: [cotizaciones_controller_1.CotizacionesController, cotizaciones_internal_controller_1.CotizacionesInternalController],
        providers: [cotizaciones_service_1.CotizacionesService],
        exports: [cotizaciones_service_1.CotizacionesService],
    })
], CotizacionesModule);
//# sourceMappingURL=cotizaciones.module.js.map