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
exports.DevolucionesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const devolucion_entity_1 = require("./devolucion.entity");
let DevolucionesService = class DevolucionesService {
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger('DevolucionesService');
    }
    generateFolio() {
        return 'DEV-' + Date.now().toString(36).toUpperCase();
    }
    async findByVenta(ventaId, scope) {
        return this.repo.find({
            where: { venta_id: ventaId, tenant_id: scope.tenant_id },
            order: { created_at: 'DESC' },
        });
    }
    async findAll(scope, desde, hasta) {
        let query = this.repo.createQueryBuilder('d')
            .where('d.tenant_id = :tid AND d.tienda_id = :sid', {
            tid: scope.tenant_id,
            sid: scope.tienda_id,
        });
        if (desde)
            query = query.andWhere('d.created_at >= :desde', { desde });
        if (hasta)
            query = query.andWhere('d.created_at <= :hasta', { hasta: `${hasta} 23:59:59` });
        return query.orderBy('d.created_at', 'DESC').getMany();
    }
    async crear(dto, scope) {
        const [venta] = await this.dataSource.query(`SELECT v.id, v.folio, v.estado, v.tenant_id, v.tienda_id
       FROM ventas v WHERE v.id = ? AND v.tenant_id = ?`, [dto.venta_id, scope.tenant_id]);
        if (!venta)
            throw new common_1.NotFoundException('Venta no encontrada');
        if (venta.estado === 'cancelada')
            throw new common_1.BadRequestException('No se puede devolver una venta cancelada');
        const detalles = await this.dataSource.query(`SELECT vd.producto_id, vd.producto_nombre, vd.producto_sku,
              vd.cantidad, vd.precio_unitario
       FROM venta_detalles vd WHERE vd.venta_id = ?`, [dto.venta_id]);
        const devueltoMap = {};
        const devolucionesExistentes = await this.repo.find({ where: { venta_id: dto.venta_id } });
        for (const dev of devolucionesExistentes) {
            for (const item of dev.items) {
                devueltoMap[item.producto_id] = (devueltoMap[item.producto_id] || 0) + Number(item.cantidad);
            }
        }
        const itemsDevolucion = [];
        let montoTotal = 0;
        for (const itemDto of dto.items) {
            if (!itemDto.cantidad || itemDto.cantidad <= 0)
                continue;
            const detalle = detalles.find(d => Number(d.producto_id) === Number(itemDto.producto_id));
            if (!detalle)
                throw new common_1.BadRequestException(`Producto ${itemDto.producto_id} no está en la venta`);
            const yaDevueltoCantidad = devueltoMap[itemDto.producto_id] || 0;
            const disponible = Number(detalle.cantidad) - yaDevueltoCantidad;
            if (itemDto.cantidad > disponible) {
                throw new common_1.BadRequestException(`"${detalle.producto_nombre}": máximo a devolver es ${disponible} (ya se devolvieron ${yaDevueltoCantidad})`);
            }
            const subtotal = Number(detalle.precio_unitario) * Number(itemDto.cantidad);
            itemsDevolucion.push({
                producto_id: Number(detalle.producto_id),
                nombre: detalle.producto_nombre,
                sku: detalle.producto_sku,
                cantidad: Number(itemDto.cantidad),
                precio_unitario: Number(detalle.precio_unitario),
                subtotal,
            });
            montoTotal += subtotal;
        }
        if (!itemsDevolucion.length)
            throw new common_1.BadRequestException('No hay ítems válidos para devolver');
        const entity = new devolucion_entity_1.Devolucion();
        entity.tenant_id = scope.tenant_id;
        entity.empresa_id = scope.empresa_id;
        entity.tienda_id = scope.tienda_id;
        entity.venta_id = dto.venta_id;
        entity.folio = this.generateFolio();
        entity.venta_folio = venta.folio;
        entity.usuario_id = scope.id || scope.sub;
        entity.usuario_nombre = scope.nombre || 'Sistema';
        if (dto.motivo)
            entity.motivo = dto.motivo;
        entity.items = itemsDevolucion;
        entity.monto_total = montoTotal;
        const devolucion = await this.repo.save(entity);
        for (const item of itemsDevolucion) {
            try {
                await this.dataSource.transaction(async (manager) => {
                    const [prod] = await manager.query('SELECT id, controla_stock, stock_actual, nombre, sku FROM productos WHERE id = ? AND tenant_id = ? FOR UPDATE', [item.producto_id, scope.tenant_id]);
                    if (!prod?.controla_stock)
                        return;
                    const stockAnterior = Number(prod.stock_actual || 0);
                    const stockNuevo = stockAnterior + Number(item.cantidad);
                    await manager.query('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockNuevo, prod.id]);
                    await manager.query(`INSERT INTO movimientos_inventario
              (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
               tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
             VALUES (?, ?, ?, ?, ?, ?, 'entrada', ?, ?, ?, ?, ?, ?)`, [
                        scope.tenant_id, scope.empresa_id, scope.tienda_id,
                        prod.id, prod.nombre, prod.sku,
                        Number(item.cantidad), stockAnterior, stockNuevo,
                        `Devolución ${devolucion.folio} (Venta ${venta.folio})`,
                        scope.id || scope.sub,
                        scope.nombre || 'Sistema',
                    ]);
                });
            }
            catch (e) {
                this.logger.error(`Error reponiendo stock producto ${item.producto_id}: ${e?.message}`);
            }
        }
        this.logger.log(`Devolución ${devolucion.folio} creada — Venta ${venta.folio} — $${montoTotal.toFixed(2)}`);
        return devolucion;
    }
    async findOne(id, scope) {
        const dev = await this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
        if (!dev)
            throw new common_1.NotFoundException('Devolución no encontrada');
        return dev;
    }
};
exports.DevolucionesService = DevolucionesService;
exports.DevolucionesService = DevolucionesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(devolucion_entity_1.Devolucion)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], DevolucionesService);
//# sourceMappingURL=devoluciones.service.js.map