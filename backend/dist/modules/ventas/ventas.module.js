"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VentasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const venta_entity_1 = require("./venta.entity");
const auditoria_entity_1 = require("./auditoria.entity");
const caja_entity_1 = require("../caja/caja.entity");
const ventas_controller_1 = require("./ventas.controller");
const ventas_service_1 = require("./ventas.service");
let VentasModule = class VentasModule {
};
exports.VentasModule = VentasModule;
exports.VentasModule = VentasModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([venta_entity_1.Venta, venta_entity_1.VentaDetalle, venta_entity_1.VentaPago, auditoria_entity_1.Auditoria, caja_entity_1.Caja])],
        controllers: [ventas_controller_1.VentasController],
        providers: [ventas_service_1.VentasService],
        exports: [ventas_service_1.VentasService],
    })
], VentasModule);
//# sourceMappingURL=ventas.module.js.map