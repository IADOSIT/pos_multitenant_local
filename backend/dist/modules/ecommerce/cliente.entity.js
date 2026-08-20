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
exports.Cliente = void 0;
const typeorm_1 = require("typeorm");
let Cliente = class Cliente {
};
exports.Cliente = Cliente;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Cliente.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Cliente.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Cliente.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Cliente.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Cliente.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Cliente.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 250, nullable: true }),
    __metadata("design:type", String)
], Cliente.prototype, "razon_social", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 13, nullable: true }),
    __metadata("design:type", String)
], Cliente.prototype, "rfc", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Cliente.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Cliente.prototype, "updated_at", void 0);
exports.Cliente = Cliente = __decorate([
    (0, typeorm_1.Entity)('clientes'),
    (0, typeorm_1.Index)(['empresa_id', 'email'], { unique: true })
], Cliente);
//# sourceMappingURL=cliente.entity.js.map