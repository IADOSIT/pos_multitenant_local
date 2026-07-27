"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasculaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_bascula_entity_1 = require("./config-bascula.entity");
const pesaje_log_entity_1 = require("./pesaje-log.entity");
const bascula_service_1 = require("./bascula.service");
const bascula_gateway_1 = require("./bascula.gateway");
const bascula_controller_1 = require("./bascula.controller");
const ventas_module_1 = require("../ventas/ventas.module");
let BasculaModule = class BasculaModule {
};
exports.BasculaModule = BasculaModule;
exports.BasculaModule = BasculaModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([config_bascula_entity_1.ConfigBascula, pesaje_log_entity_1.PesajeLog]), ventas_module_1.VentasModule],
        controllers: [bascula_controller_1.BasculaController],
        providers: [bascula_service_1.BasculaService, bascula_gateway_1.BasculaGateway],
        exports: [bascula_service_1.BasculaService],
    })
], BasculaModule);
//# sourceMappingURL=bascula.module.js.map