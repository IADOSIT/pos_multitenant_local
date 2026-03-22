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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
let TenantsService = class TenantsService {
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
    }
    findAll() {
        return this.repo.find({ order: { nombre: 'ASC' }, relations: ['empresas'] });
    }
    findOne(id) {
        return this.repo.findOne({ where: { id }, relations: ['empresas', 'empresas.tiendas'] });
    }
    async create(data) {
        const slug = data.nombre.toLowerCase().replace(/\s+/g, '-');
        const exists = await this.repo.findOne({ where: { slug } });
        if (exists)
            throw new common_1.BadRequestException('Ya existe un tenant con ese nombre');
        return this.repo.save(this.repo.create({ ...data, slug }));
    }
    async update(id, data) {
        const { id: _id, created_at, updated_at, empresas, ...clean } = data;
        await this.repo.update(id, clean);
        return this.findOne(id);
    }
    async softDelete(id) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            await qr.query('DELETE FROM venta_detalles WHERE venta_id IN (SELECT id FROM ventas WHERE tenant_id = ?)', [id]);
            await qr.query('DELETE FROM ventas WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM pedido_detalles WHERE pedido_id IN (SELECT id FROM pedidos WHERE tenant_id = ?)', [id]);
            await qr.query('DELETE FROM pedidos WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM movimientos_caja WHERE caja_id IN (SELECT id FROM cajas WHERE tenant_id = ?)', [id]);
            await qr.query('DELETE FROM cajas WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM venta_pagos WHERE venta_id IN (SELECT id FROM ventas WHERE tenant_id = ?)', [id]);
            await qr.query('DELETE FROM materia_prima WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM movimientos_inventario WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM producto_tienda WHERE producto_id IN (SELECT id FROM productos WHERE tenant_id = ?)', [id]);
            await qr.query('DELETE FROM productos WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM categorias WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM ticket_configs WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM auditoria WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM licencias WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM tiendas WHERE tenant_id = ?', [id]);
            await qr.query("DELETE FROM users WHERE tenant_id = ? AND rol != 'superadmin'", [id]);
            await qr.query('DELETE FROM empresas WHERE tenant_id = ?', [id]);
            await qr.query('DELETE FROM tenants WHERE id = ?', [id]);
            await qr.commitTransaction();
            return { deleted: true };
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw new common_1.BadRequestException('Error al eliminar tenant: ' + err.message);
        }
        finally {
            await qr.release();
        }
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map