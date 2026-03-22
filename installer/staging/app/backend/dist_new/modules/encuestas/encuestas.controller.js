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
exports.EncuestasController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
const encuestas_service_1 = require("./encuestas.service");
let EncuestasController = class EncuestasController {
    constructor(service) {
        this.service = service;
    }
    findAll(scope, limit) {
        return this.service.findAll(scope, limit ? parseInt(limit) : 50);
    }
    getKPIs(scope, desde, hasta) {
        return this.service.getKPIs(scope, desde, hasta);
    }
};
exports.EncuestasController = EncuestasController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('kpis'),
    __param(0, (0, tenant_decorator_1.TenantScope)()),
    __param(1, (0, common_1.Query)('desde')),
    __param(2, (0, common_1.Query)('hasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "getKPIs", null);
exports.EncuestasController = EncuestasController = __decorate([
    (0, common_1.Controller)('encuestas'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [encuestas_service_1.EncuestasService])
], EncuestasController);
//# sourceMappingURL=encuestas.controller.js.map