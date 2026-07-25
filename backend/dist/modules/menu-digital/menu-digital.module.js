"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuDigitalModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const menu_digital_config_entity_1 = require("./entities/menu-digital-config.entity");
const menu_digital_snapshot_entity_1 = require("./entities/menu-digital-snapshot.entity");
const menu_digital_log_entity_1 = require("./entities/menu-digital-log.entity");
const menu_digital_order_entity_1 = require("./entities/menu-digital-order.entity");
const producto_entity_1 = require("../productos/producto.entity");
const categoria_entity_1 = require("../categorias/categoria.entity");
const tienda_entity_1 = require("../tiendas/tienda.entity");
const empresa_entity_1 = require("../empresas/empresa.entity");
const menu_digital_service_1 = require("./menu-digital.service");
const menu_digital_controller_1 = require("./menu-digital.controller");
const notificaciones_module_1 = require("../notificaciones/notificaciones.module");
let MenuDigitalModule = class MenuDigitalModule {
};
exports.MenuDigitalModule = MenuDigitalModule;
exports.MenuDigitalModule = MenuDigitalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                menu_digital_config_entity_1.MenuDigitalConfig,
                menu_digital_snapshot_entity_1.MenuDigitalSnapshot,
                menu_digital_log_entity_1.MenuDigitalLog,
                menu_digital_order_entity_1.MenuDigitalOrder,
                producto_entity_1.Producto,
                categoria_entity_1.Categoria,
                tienda_entity_1.Tienda,
                empresa_entity_1.Empresa,
            ]),
            notificaciones_module_1.NotificacionesModule,
        ],
        controllers: [menu_digital_controller_1.MenuDigitalController],
        providers: [menu_digital_service_1.MenuDigitalService],
        exports: [menu_digital_service_1.MenuDigitalService],
    })
], MenuDigitalModule);
//# sourceMappingURL=menu-digital.module.js.map