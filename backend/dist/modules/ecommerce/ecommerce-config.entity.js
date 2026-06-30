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
exports.EcommerceConfig = void 0;
const typeorm_1 = require("typeorm");
let EcommerceConfig = class EcommerceConfig {
};
exports.EcommerceConfig = EcommerceConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EcommerceConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EcommerceConfig.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EcommerceConfig.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EcommerceConfig.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 63, nullable: true }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "subdominio", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "nombre_tienda", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 7, default: '#1e40af' }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "color_primario", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 7, default: '#0f172a' }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "color_secundario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "banner_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "politica_envio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "terminos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "mensaje_mayoreo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EcommerceConfig.prototype, "modo_mayoreo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 10 }),
    __metadata("design:type", Number)
], EcommerceConfig.prototype, "qty_min_mayoreo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'lumina' }),
    __metadata("design:type", String)
], EcommerceConfig.prototype, "tema_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EcommerceConfig.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EcommerceConfig.prototype, "updated_at", void 0);
exports.EcommerceConfig = EcommerceConfig = __decorate([
    (0, typeorm_1.Entity)('ecommerce_config'),
    (0, typeorm_1.Index)(['empresa_id'], { unique: true }),
    (0, typeorm_1.Index)(['subdominio'], { unique: true })
], EcommerceConfig);
//# sourceMappingURL=ecommerce-config.entity.js.map