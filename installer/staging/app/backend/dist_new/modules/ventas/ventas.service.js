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
exports.VentasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const venta_entity_1 = require("./venta.entity");
const auditoria_entity_1 = require("./auditoria.entity");
const caja_entity_1 = require("../caja/caja.entity");
let VentasService = class VentasService {
    constructor(ventasRepo, auditoriaRepo, cajaRepo, dataSource) {
        this.ventasRepo = ventasRepo;
        this.auditoriaRepo = auditoriaRepo;
        this.cajaRepo = cajaRepo;
        this.dataSource = dataSource;
    }
    async generateFolio(tienda_id) {
        return this.dataSource.transaction(async (manager) => {
            const [tienda] = await manager.query('SELECT folio_venta_counter, nombre FROM tiendas WHERE id = ? FOR UPDATE', [tienda_id]);
            const newCounter = (tienda?.folio_venta_counter || 0) + 1;
            await manager.query('UPDATE tiendas SET folio_venta_counter = ? WHERE id = ?', [newCounter, tienda_id]);
            const initial = (tienda?.nombre || 'X')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '')
                .charAt(0).toUpperCase() || 'X';
            return `I${initial}${String(newCounter).padStart(8, '0')}`;
        });
    }
    async crear(data, scope) {
        const caja = await this.cajaRepo.findOne({
            where: { id: data.caja_id, estado: caja_entity_1.CajaEstado.ABIERTA },
        });
        if (!caja)
            throw new common_1.BadRequestException('La caja no está abierta');
        const folio = await this.generateFolio(scope.tienda_id);
        const venta = this.ventasRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
            caja_id: data.caja_id,
            usuario_id: scope.id || scope.sub,
            folio,
            folio_offline: data.folio_offline || null,
            subtotal: data.subtotal,
            descuento: data.descuento || 0,
            impuestos: data.impuestos || 0,
            total: data.total,
            metodo_pago: data.metodo_pago,
            pago_efectivo: data.pago_efectivo,
            pago_tarjeta: data.pago_tarjeta,
            pago_transferencia: data.pago_transferencia,
            cambio: data.cambio || 0,
            notas: data.notas,
            cliente_nombre: data.cliente_nombre,
            tipo_servicio: data.tipo_servicio || 'en_sitio',
            sincronizado: !data.folio_offline,
            detalles: data.items.map((item) => ({
                producto_id: item.producto_id,
                producto_nombre: item.nombre,
                producto_sku: item.sku,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                descuento: item.descuento || 0,
                impuesto: item.impuesto || 0,
                subtotal: item.cantidad * item.precio - (item.descuento || 0),
                modificadores: item.modificadores,
                notas: item.notas,
            })),
            pagos: data.pagos || [],
        });
        const saved = await this.ventasRepo.save(venta);
        caja.total_ventas = Number(caja.total_ventas) + Number(data.total);
        await this.cajaRepo.save(caja);
        await this.auditoriaRepo.save(this.auditoriaRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
            usuario_id: scope.id || scope.sub,
            usuario_nombre: scope.nombre,
            accion: 'crear',
            entidad: 'venta',
            entidad_id: saved.id,
            datos_nuevos: { folio, total: data.total, items: data.items.length },
        }));
        return saved;
    }
    async cancelar(id, motivo, scope) {
        const venta = await this.ventasRepo.findOne({ where: { id }, relations: ['detalles'] });
        if (!venta)
            throw new common_1.BadRequestException('Venta no encontrada');
        if (venta.estado === venta_entity_1.VentaEstado.CANCELADA)
            throw new common_1.BadRequestException('Ya está cancelada');
        venta.estado = venta_entity_1.VentaEstado.CANCELADA;
        venta.notas = `${venta.notas || ''} | CANCELADA: ${motivo}`;
        const saved = await this.ventasRepo.save(venta);
        await this.auditoriaRepo.save(this.auditoriaRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
            usuario_id: scope.id || scope.sub,
            usuario_nombre: scope.nombre,
            accion: 'cancelar',
            entidad: 'venta',
            entidad_id: id,
            datos_anteriores: { estado: venta_entity_1.VentaEstado.COMPLETADA },
            datos_nuevos: { estado: venta_entity_1.VentaEstado.CANCELADA, motivo },
        }));
        return saved;
    }
    findAll(scope, fecha_inicio, fecha_fin) {
        const where = {
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
        };
        if (fecha_inicio && fecha_fin) {
            where.created_at = (0, typeorm_2.Between)(new Date(fecha_inicio), new Date(fecha_fin));
        }
        return this.ventasRepo.find({ where, relations: ['detalles'], order: { created_at: 'DESC' }, take: 100 });
    }
    findOne(id) {
        return this.ventasRepo.findOne({ where: { id }, relations: ['detalles', 'pagos'] });
    }
    async syncOffline(ventas, scope) {
        const results = [];
        for (const v of ventas) {
            const existing = await this.ventasRepo.findOne({ where: { folio_offline: v.folio_offline } });
            if (existing) {
                results.push({ folio_offline: v.folio_offline, status: 'already_synced', id: existing.id });
                continue;
            }
            const saved = await this.crear(v, scope);
            results.push({ folio_offline: v.folio_offline, status: 'synced', id: saved.id, folio: saved.folio });
        }
        return results;
    }
};
exports.VentasService = VentasService;
exports.VentasService = VentasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(venta_entity_1.Venta)),
    __param(1, (0, typeorm_1.InjectRepository)(auditoria_entity_1.Auditoria)),
    __param(2, (0, typeorm_1.InjectRepository)(caja_entity_1.Caja)),
    __param(3, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], VentasService);
//# sourceMappingURL=ventas.service.js.map