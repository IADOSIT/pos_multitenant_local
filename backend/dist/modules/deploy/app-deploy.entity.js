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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDeploy = void 0;
const typeorm_1 = require("typeorm");
let AppDeploy = class AppDeploy {
};
exports.AppDeploy = AppDeploy;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], AppDeploy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: '' }),
    __metadata("design:type", String)
], AppDeploy.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['en_progreso', 'completada'], default: 'completada' }),
    __metadata("design:type", String)
], AppDeploy.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AppDeploy.prototype, "mensaje", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AppDeploy.prototype, "updated_at", void 0);
exports.AppDeploy = AppDeploy = __decorate([
    (0, typeorm_1.Entity)('app_deploy')
], AppDeploy);
//# sourceMappingURL=app-deploy.entity.js.map