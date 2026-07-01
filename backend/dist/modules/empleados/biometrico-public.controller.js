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
exports.BiometricoPublicController = void 0;
const common_1 = require("@nestjs/common");
const biometrico_service_1 = require("./biometrico.service");
let BiometricoPublicController = class BiometricoPublicController {
    constructor(bio) {
        this.bio = bio;
    }
    getTemplates(token) {
        return this.bio.getTemplates(token);
    }
    heartbeat(token) {
        return this.bio.heartbeat(token);
    }
};
exports.BiometricoPublicController = BiometricoPublicController;
__decorate([
    (0, common_1.Get)('templates/:empresa_token'),
    __param(0, (0, common_1.Param)('empresa_token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BiometricoPublicController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)('heartbeat/:empresa_token'),
    __param(0, (0, common_1.Param)('empresa_token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BiometricoPublicController.prototype, "heartbeat", null);
exports.BiometricoPublicController = BiometricoPublicController = __decorate([
    (0, common_1.Controller)('public/biometrico'),
    __metadata("design:paramtypes", [biometrico_service_1.BiometricoService])
], BiometricoPublicController);
//# sourceMappingURL=biometrico-public.controller.js.map