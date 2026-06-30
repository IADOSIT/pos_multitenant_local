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
exports.LogisticaPublicController = void 0;
const common_1 = require("@nestjs/common");
const logistica_service_1 = require("./logistica.service");
let LogisticaPublicController = class LogisticaPublicController {
    constructor(service) {
        this.service = service;
    }
    getRepartidorView(token) {
        return this.service.getRepartidorByToken(token);
    }
    updateEstadoByToken(token, entrega_id, body) {
        return this.service.updateEstadoByToken(token, entrega_id, body.estado, body.notas);
    }
};
exports.LogisticaPublicController = LogisticaPublicController;
__decorate([
    (0, common_1.Get)(':token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LogisticaPublicController.prototype, "getRepartidorView", null);
__decorate([
    (0, common_1.Patch)(':token/entrega/:entrega_id'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Param)('entrega_id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], LogisticaPublicController.prototype, "updateEstadoByToken", null);
exports.LogisticaPublicController = LogisticaPublicController = __decorate([
    (0, common_1.Controller)('public/logistica'),
    __metadata("design:paramtypes", [logistica_service_1.LogisticaService])
], LogisticaPublicController);
//# sourceMappingURL=logistica-public.controller.js.map