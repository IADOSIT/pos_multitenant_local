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
exports.EcommerceProductoConfig = void 0;
const typeorm_1 = require("typeorm");
let EcommerceProductoConfig = class EcommerceProductoConfig {
};
exports.EcommerceProductoConfig = EcommerceProductoConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EcommerceProductoConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", Number)
], EcommerceProductoConfig.prototype, "producto_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EcommerceProductoConfig.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EcommerceProductoConfig.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], EcommerceProductoConfig.prototype, "precio_mayoreo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], EcommerceProductoConfig.prototype, "qty_min_mayoreo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], EcommerceProductoConfig.prototype, "visible_ecommerce", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EcommerceProductoConfig.prototype, "descripcion_larga", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], EcommerceProductoConfig.prototype, "imagenes_extra", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], EcommerceProductoConfig.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], EcommerceProductoConfig.prototype, "etiquetas", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], EcommerceProductoConfig.prototype, "orden_ecommerce", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EcommerceProductoConfig.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EcommerceProductoConfig.prototype, "updated_at", void 0);
exports.EcommerceProductoConfig = EcommerceProductoConfig = __decorate([
    (0, typeorm_1.Entity)('ecommerce_producto_config'),
    (0, typeorm_1.Index)(['producto_id'], { unique: true }),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id'])
], EcommerceProductoConfig);
//# sourceMappingURL=ecommerce-producto-config.entity.js.map