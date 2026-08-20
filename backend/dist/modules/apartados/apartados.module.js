"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApartadosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const apartado_entity_1 = require("./apartado.entity");
const apartados_controller_1 = require("./apartados.controller");
const apartados_service_1 = require("./apartados.service");
let ApartadosModule = class ApartadosModule {
};
exports.ApartadosModule = ApartadosModule;
exports.ApartadosModule = ApartadosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([apartado_entity_1.ApartadoInventario])],
        controllers: [apartados_controller_1.ApartadosController],
        providers: [apartados_service_1.ApartadosService],
        exports: [apartados_service_1.ApartadosService],
    })
], ApartadosModule);
//# sourceMappingURL=apartados.module.js.map