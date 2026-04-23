"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevolucionesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const devolucion_entity_1 = require("./devolucion.entity");
const devoluciones_service_1 = require("./devoluciones.service");
const devoluciones_controller_1 = require("./devoluciones.controller");
let DevolucionesModule = class DevolucionesModule {
};
exports.DevolucionesModule = DevolucionesModule;
exports.DevolucionesModule = DevolucionesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([devolucion_entity_1.Devolucion])],
        controllers: [devoluciones_controller_1.DevolucionesController],
        providers: [devoluciones_service_1.DevolucionesService],
        exports: [devoluciones_service_1.DevolucionesService],
    })
], DevolucionesModule);
//# sourceMappingURL=devoluciones.module.js.map