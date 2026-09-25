"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CotizacionesInternalController = void 0;
const common_1 = require("@nestjs/common");
const internal_secret_guard_1 = require("../../common/guards/internal-secret.guard");
const cotizaciones_service_1 = require("./cotizaciones.service");
let CotizacionesInternalController = class CotizacionesInternalController {
    constructor(service) {
        this.service = service;
    }
    materializar(id) {
        return this.service.materializarPedido(id);
    }
};
exports.CotizacionesInternalController = CotizacionesInternalController;
__decorate([
    (0, common_1.Post)(':id/pedido'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CotizacionesInternalController.prototype, "materializar", null);
exports.CotizacionesInternalController = CotizacionesInternalController = __decorate([
    (0, common_1.Controller)('internal/cotizaciones'),
    (0, common_1.UseGuards)(internal_secret_guard_1.InternalSecretGuard),
    __metadata("design:paramtypes", [cotizaciones_service_1.CotizacionesService])
], CotizacionesInternalController);
//# sourceMappingURL=cotizaciones-internal.controller.js.map