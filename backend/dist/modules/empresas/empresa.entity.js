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
exports.Empresa = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../tenants/tenant.entity");
const tienda_entity_1 = require("../tiendas/tienda.entity");
let Empresa = class Empresa {
};
exports.Empresa = Empresa;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Empresa.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Empresa.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Empresa.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], Empresa.prototype, "razon_social", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Empresa.prototype, "rfc", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], Empresa.prototype, "direccion", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Empresa.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Empresa.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], Empresa.prototype, "logo_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Empresa.prototype, "config_apariencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Empresa.prototype, "config_especial", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Empresa.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Empresa.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Empresa.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, (t) => t.empresas),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], Empresa.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => tienda_entity_1.Tienda, (t) => t.empresa),
    __metadata("design:type", Array)
], Empresa.prototype, "tiendas", void 0);
exports.Empresa = Empresa = __decorate([
    (0, typeorm_1.Entity)('empresas'),
    (0, typeorm_1.Index)(['tenant_id'])
], Empresa);
//# sourceMappingURL=empresa.entity.js.map