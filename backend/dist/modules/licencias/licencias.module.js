"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenciasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const licencia_entity_1 = require("./licencia.entity");
const licencias_service_1 = require("./licencias.service");
const licencias_controller_1 = require("./licencias.controller");
let LicenciasModule = class LicenciasModule {
};
exports.LicenciasModule = LicenciasModule;
exports.LicenciasModule = LicenciasModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([licencia_entity_1.Licencia])],
        controllers: [licencias_controller_1.LicenciasController],
        providers: [licencias_service_1.LicenciasService],
        exports: [licencias_service_1.LicenciasService],
    })
], LicenciasModule);
//# sourceMappingURL=licencias.module.js.map