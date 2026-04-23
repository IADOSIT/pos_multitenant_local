"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MateriaPrimaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const materia_prima_entity_1 = require("./materia-prima.entity");
const materia_prima_controller_1 = require("./materia-prima.controller");
const materia_prima_service_1 = require("./materia-prima.service");
let MateriaPrimaModule = class MateriaPrimaModule {
};
exports.MateriaPrimaModule = MateriaPrimaModule;
exports.MateriaPrimaModule = MateriaPrimaModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([materia_prima_entity_1.MateriaPrima])],
        controllers: [materia_prima_controller_1.MateriaPrimaController],
        providers: [materia_prima_service_1.MateriaPrimaService],
        exports: [materia_prima_service_1.MateriaPrimaService],
    })
], MateriaPrimaModule);
//# sourceMappingURL=materia-prima.module.js.map