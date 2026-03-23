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
exports.MenuDigitalSnapshot = void 0;
const typeorm_1 = require("typeorm");
let MenuDigitalSnapshot = class MenuDigitalSnapshot {
};
exports.MenuDigitalSnapshot = MenuDigitalSnapshot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MenuDigitalSnapshot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], MenuDigitalSnapshot.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MenuDigitalSnapshot.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MenuDigitalSnapshot.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MenuDigitalSnapshot.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'consulta' }),
    __metadata("design:type", String)
], MenuDigitalSnapshot.prototype, "modo_menu", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'oscuro' }),
    __metadata("design:type", String)
], MenuDigitalSnapshot.prototype, "plantilla", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], MenuDigitalSnapshot.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'longtext', nullable: true }),
    __metadata("design:type", String)
], MenuDigitalSnapshot.prototype, "tienda_json", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'longtext', nullable: true }),
    __metadata("design:type", String)
], MenuDigitalSnapshot.prototype, "categorias_json", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'longtext', nullable: true }),
    __metadata("design:type", String)
], MenuDigitalSnapshot.prototype, "productos_json", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], MenuDigitalSnapshot.prototype, "published_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MenuDigitalSnapshot.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MenuDigitalSnapshot.prototype, "updated_at", void 0);
exports.MenuDigitalSnapshot = MenuDigitalSnapshot = __decorate([
    (0, typeorm_1.Entity)('menu_digital_snapshot'),
    (0, typeorm_1.Unique)('UQ_mds_slug', ['slug'])
], MenuDigitalSnapshot);
//# sourceMappingURL=menu-digital-snapshot.entity.js.map