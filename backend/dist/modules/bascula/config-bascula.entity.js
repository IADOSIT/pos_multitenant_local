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
exports.ConfigBascula = void 0;
const typeorm_1 = require("typeorm");
let ConfigBascula = class ConfigBascula {
};
exports.ConfigBascula = ConfigBascula;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ConfigBascula.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", Number)
], ConfigBascula.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ConfigBascula.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ConfigBascula.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ConfigBascula.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ConfigBascula.prototype, "usar_en_pos", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ConfigBascula.prototype, "tienda_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], ConfigBascula.prototype, "printer_ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 9100 }),
    __metadata("design:type", Number)
], ConfigBascula.prototype, "printer_port", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 40 }),
    __metadata("design:type", Number)
], ConfigBascula.prototype, "label_width_mm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 30 }),
    __metadata("design:type", Number)
], ConfigBascula.prototype, "label_height_mm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], ConfigBascula.prototype, "scale_port", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 9600 }),
    __metadata("design:type", Number)
], ConfigBascula.prototype, "scale_baud_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'generic' }),
    __metadata("design:type", String)
], ConfigBascula.prototype, "scale_protocol", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ConfigBascula.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ConfigBascula.prototype, "updated_at", void 0);
exports.ConfigBascula = ConfigBascula = __decorate([
    (0, typeorm_1.Entity)('config_bascula')
], ConfigBascula);
//# sourceMappingURL=config-bascula.entity.js.map