"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const perfil_negocio_entity_1 = require("./perfil-negocio.entity");
const tenant_perfil_entity_1 = require("./tenant-perfil.entity");
const producto_entity_1 = require("../productos/producto.entity");
const categoria_entity_1 = require("../categorias/categoria.entity");
const perfiles_service_1 = require("./perfiles.service");
const perfiles_controller_1 = require("./perfiles.controller");
let PerfilesModule = class PerfilesModule {
};
exports.PerfilesModule = PerfilesModule;
exports.PerfilesModule = PerfilesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([perfil_negocio_entity_1.PerfilNegocio, tenant_perfil_entity_1.TenantPerfil, producto_entity_1.Producto, categoria_entity_1.Categoria])],
        controllers: [perfiles_controller_1.PerfilesController],
        providers: [perfiles_service_1.PerfilesService],
        exports: [perfiles_service_1.PerfilesService],
    })
], PerfilesModule);
//# sourceMappingURL=perfiles.module.js.map