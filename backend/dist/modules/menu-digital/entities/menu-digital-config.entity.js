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
exports.MenuDigitalConfig = void 0;
const typeorm_1 = require("typeorm");
let MenuDigitalConfig = class MenuDigitalConfig {
};
exports.MenuDigitalConfig = MenuDigitalConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MenuDigitalConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MenuDigitalConfig.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MenuDigitalConfig.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MenuDigitalConfig.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], MenuDigitalConfig.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'consulta' }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "modo_menu", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'manual' }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "sync_mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 30 }),
    __metadata("design:type", Number)
], MenuDigitalConfig.prototype, "sync_interval", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "cloud_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "worker_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "api_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], MenuDigitalConfig.prototype, "last_published_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "last_publish_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'oscuro' }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "plantilla", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], MenuDigitalConfig.prototype, "cantidades_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: '10,25,50,100' }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "cantidades_rapidas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MenuDigitalConfig.prototype, "last_publish_error", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MenuDigitalConfig.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MenuDigitalConfig.prototype, "updated_at", void 0);
exports.MenuDigitalConfig = MenuDigitalConfig = __decorate([
    (0, typeorm_1.Entity)('menu_digital_config'),
    (0, typeorm_1.Index)('IDX_mdc_tenant_empresa', ['tenant_id', 'empresa_id']),
    (0, typeorm_1.Unique)('UQ_mdc_tienda', ['tienda_id']),
    (0, typeorm_1.Unique)('UQ_mdc_slug', ['slug'])
], MenuDigitalConfig);
//# sourceMappingURL=menu-digital-config.entity.js.map