"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncuestasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const encuesta_entity_1 = require("./encuesta.entity");
const encuestas_service_1 = require("./encuestas.service");
const encuestas_controller_1 = require("./encuestas.controller");
let EncuestasModule = class EncuestasModule {
};
exports.EncuestasModule = EncuestasModule;
exports.EncuestasModule = EncuestasModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([encuesta_entity_1.EncuestaServicio])],
        controllers: [encuestas_controller_1.EncuestasController],
        providers: [encuestas_service_1.EncuestasService],
        exports: [encuestas_service_1.EncuestasService],
    })
], EncuestasModule);
//# sourceMappingURL=encuestas.module.js.map