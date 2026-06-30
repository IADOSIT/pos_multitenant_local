"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const repartidor_entity_1 = require("./repartidor.entity");
const entrega_pedido_entity_1 = require("./entrega-pedido.entity");
const config_logistica_entity_1 = require("./config-logistica.entity");
const log_notif_entrega_entity_1 = require("./log-notif-entrega.entity");
const logistica_service_1 = require("./logistica.service");
const logistica_controller_1 = require("./logistica.controller");
const logistica_public_controller_1 = require("./logistica-public.controller");
let LogisticaModule = class LogisticaModule {
};
exports.LogisticaModule = LogisticaModule;
exports.LogisticaModule = LogisticaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                repartidor_entity_1.Repartidor,
                entrega_pedido_entity_1.EntregaPedido,
                config_logistica_entity_1.ConfigLogistica,
                log_notif_entrega_entity_1.LogNotifEntrega,
            ]),
        ],
        controllers: [logistica_controller_1.LogisticaController, logistica_public_controller_1.LogisticaPublicController],
        providers: [logistica_service_1.LogisticaService],
        exports: [logistica_service_1.LogisticaService],
    })
], LogisticaModule);
//# sourceMappingURL=logistica.module.js.map