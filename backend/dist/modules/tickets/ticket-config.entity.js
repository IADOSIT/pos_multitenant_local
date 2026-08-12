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
exports.TicketConfig = void 0;
const typeorm_1 = require("typeorm");
let TicketConfig = class TicketConfig {
};
exports.TicketConfig = TicketConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TicketConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TicketConfig.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TicketConfig.prototype, "empresa_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TicketConfig.prototype, "tienda_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TicketConfig.prototype, "logo_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], TicketConfig.prototype, "encabezado_linea1", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], TicketConfig.prototype, "encabezado_linea2", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], TicketConfig.prototype, "encabezado_linea3", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], TicketConfig.prototype, "pie_linea1", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], TicketConfig.prototype, "pie_linea2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 80 }),
    __metadata("design:type", Number)
], TicketConfig.prototype, "ancho_papel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 42 }),
    __metadata("design:type", Number)
], TicketConfig.prototype, "columnas", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "mostrar_logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "mostrar_fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "mostrar_cajero", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "mostrar_folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "mostrar_marca_iados", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: 'Consolas' }),
    __metadata("design:type", String)
], TicketConfig.prototype, "fuente_familia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 11 }),
    __metadata("design:type", Number)
], TicketConfig.prototype, "fuente_tamano", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'centro' }),
    __metadata("design:type", String)
], TicketConfig.prototype, "logo_posicion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], TicketConfig.prototype, "copias", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "impresion_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'navegador' }),
    __metadata("design:type", String)
], TicketConfig.prototype, "modo_impresion", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "comanda_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], TicketConfig.prototype, "comanda_header", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 80 }),
    __metadata("design:type", Number)
], TicketConfig.prototype, "comanda_ancho", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "comanda_auto_print", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "comanda_mostrar_precio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], TicketConfig.prototype, "comanda_copias", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "precuenta_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "propina_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: '10,15,20' }),
    __metadata("design:type", String)
], TicketConfig.prototype, "propina_porcentajes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketConfig.prototype, "propina_en_ticket", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TicketConfig.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TicketConfig.prototype, "updated_at", void 0);
exports.TicketConfig = TicketConfig = __decorate([
    (0, typeorm_1.Entity)('ticket_configs'),
    (0, typeorm_1.Index)(['tenant_id', 'empresa_id', 'tienda_id'])
], TicketConfig);
//# sourceMappingURL=ticket-config.entity.js.map