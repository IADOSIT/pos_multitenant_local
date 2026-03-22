"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiendasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const tienda_entity_1 = require("./tienda.entity");
const tiendas_controller_1 = require("./tiendas.controller");
const tiendas_service_1 = require("./tiendas.service");
let TiendasModule = class TiendasModule {
};
exports.TiendasModule = TiendasModule;
exports.TiendasModule = TiendasModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([tienda_entity_1.Tienda])],
        controllers: [tiendas_controller_1.TiendasController],
        providers: [tiendas_service_1.TiendasService],
        exports: [tiendas_service_1.TiendasService],
    })
], TiendasModule);
//# sourceMappingURL=tiendas.module.js.map