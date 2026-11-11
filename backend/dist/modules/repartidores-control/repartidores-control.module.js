"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepartidoresControlModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const repartidor_entity_1 = require("../logistica/repartidor.entity");
const repartidor_qr_entity_1 = require("./repartidor-qr.entity");
const repartidor_asignacion_entity_1 = require("./repartidor-asignacion.entity");
const repartidor_liquidacion_entity_1 = require("./repartidor-liquidacion.entity");
const repartidores_control_service_1 = require("./repartidores-control.service");
const repartidores_control_controller_1 = require("./repartidores-control.controller");
let RepartidoresControlModule = class RepartidoresControlModule {
};
exports.RepartidoresControlModule = RepartidoresControlModule;
exports.RepartidoresControlModule = RepartidoresControlModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([repartidor_entity_1.Repartidor, repartidor_qr_entity_1.RepartidorQr, repartidor_asignacion_entity_1.RepartidorAsignacion, repartidor_liquidacion_entity_1.RepartidorLiquidacion]),
        ],
        controllers: [repartidores_control_controller_1.RepartidoresControlController],
        providers: [repartidores_control_service_1.RepartidoresControlService],
    })
], RepartidoresControlModule);
//# sourceMappingURL=repartidores-control.module.js.map