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
exports.LogNotifEntrega = void 0;
const typeorm_1 = require("typeorm");
let LogNotifEntrega = class LogNotifEntrega {
};
exports.LogNotifEntrega = LogNotifEntrega;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LogNotifEntrega.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LogNotifEntrega.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LogNotifEntrega.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LogNotifEntrega.prototype, "pedido_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60 }),
    __metadata("design:type", String)
], LogNotifEntrega.prototype, "pedido_folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30 }),
    __metadata("design:type", String)
], LogNotifEntrega.prototype, "estado_entrega", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], LogNotifEntrega.prototype, "destinatario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LogNotifEntrega.prototype, "mensaje", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'omitido' }),
    __metadata("design:type", String)
], LogNotifEntrega.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LogNotifEntrega.prototype, "error_msg", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LogNotifEntrega.prototype, "created_at", void 0);
exports.LogNotifEntrega = LogNotifEntrega = __decorate([
    (0, typeorm_1.Entity)('log_notif_entregas'),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id']),
    (0, typeorm_1.Index)(['pedido_id'])
], LogNotifEntrega);
//# sourceMappingURL=log-notif-entrega.entity.js.map