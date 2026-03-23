"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfOrderModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pedido_entity_1 = require("../pedidos/pedido.entity");
const mesa_entity_1 = require("../mesas/mesa.entity");
const self_order_service_1 = require("./self-order.service");
const self_order_controller_1 = require("./self-order.controller");
const mesas_module_1 = require("../mesas/mesas.module");
const encuestas_module_1 = require("../encuestas/encuestas.module");
const notificaciones_module_1 = require("../notificaciones/notificaciones.module");
let SelfOrderModule = class SelfOrderModule {
};
exports.SelfOrderModule = SelfOrderModule;
exports.SelfOrderModule = SelfOrderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([pedido_entity_1.Pedido, mesa_entity_1.Mesa]),
            mesas_module_1.MesasModule,
            encuestas_module_1.EncuestasModule,
            notificaciones_module_1.NotificacionesModule,
        ],
        controllers: [self_order_controller_1.SelfOrderPublicController, self_order_controller_1.SelfOrderController],
        providers: [self_order_service_1.SelfOrderService],
        exports: [self_order_service_1.SelfOrderService],
    })
], SelfOrderModule);
//# sourceMappingURL=self-order.module.js.map