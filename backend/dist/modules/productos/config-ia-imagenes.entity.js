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
exports.ConfigIaImagenes = void 0;
const typeorm_1 = require("typeorm");
let ConfigIaImagenes = class ConfigIaImagenes {
};
exports.ConfigIaImagenes = ConfigIaImagenes;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ConfigIaImagenes.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", Number)
], ConfigIaImagenes.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ConfigIaImagenes.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'pollinations' }),
    __metadata("design:type", String)
], ConfigIaImagenes.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ConfigIaImagenes.prototype, "openai_api_key", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ConfigIaImagenes.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ConfigIaImagenes.prototype, "updated_at", void 0);
exports.ConfigIaImagenes = ConfigIaImagenes = __decorate([
    (0, typeorm_1.Entity)('config_ia_imagenes')
], ConfigIaImagenes);
//# sourceMappingURL=config-ia-imagenes.entity.js.map