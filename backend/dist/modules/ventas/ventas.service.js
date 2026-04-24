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
        this.logger = new common_1.Logger('VentasService');
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
        for (const item of data.items || []) {
            if (!item.producto_id || !item.cantidad)
                continue;
            const [prod] = await this.dataSource.query('SELECT controla_stock, stock_actual, nombre FROM productos WHERE id = ? AND tenant_id = ?', [item.producto_id, scope.tenant_id]);
            if (prod?.controla_stock && Number(prod.stock_actual) < Number(item.cantidad)) {
                throw new common_1.BadRequestException(`Stock insuficiente para "${prod.nombre}": disponible ${Number(prod.stock_actual)}, solicitado ${item.cantidad}`);
            }
        }
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
            propina: data.propina || 0,
            notas: data.notas,
            cliente_nombre: data.cliente_nombre,
            cliente_telefono: data.cliente_telefono,
            cliente_direccion: data.cliente_direccion,
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
        for (const item of data.items || []) {
            if (!item.producto_id || !item.cantidad)
                continue;
            try {
                await this.dataSource.transaction(async (manager) => {
                    const [prod] = await manager.query('SELECT id, controla_stock, stock_actual, nombre, sku FROM productos WHERE id = ? AND tenant_id = ? FOR UPDATE', [item.producto_id, scope.tenant_id]);
                    if (!prod?.controla_stock)
                        return;
                    const stockAnterior = Number(prod.stock_actual || 0);
                    const stockNuevo = stockAnterior - Number(item.cantidad);
                    await manager.query('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockNuevo, prod.id]);
                    await manager.query(`INSERT INTO movimientos_inventario
              (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
               tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
             VALUES (?, ?, ?, ?, ?, ?, 'salida', ?, ?, ?, ?, ?, ?)`, [
                        scope.tenant_id, scope.empresa_id, scope.tienda_id,
                        prod.id, prod.nombre, prod.sku,
                        Number(item.cantidad), stockAnterior, stockNuevo,
                        `Venta ${folio}`,
                        scope.id || scope.sub,
                        scope.nombre || 'Sistema',
                    ]);
                });
            }
            catch (e) {
                this.logger.error(`Error descontando stock producto ${item.producto_id}: ${e?.message}`, e?.stack);
            }
        }
        try {
            await this.sendStockAlerts(scope, folio);
        }
        catch (e) {
            this.logger.warn(`WhatsApp alert error: ${e?.message}`);
        }
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
    async buscar(scope, q) {
        if (!q || q.trim().length < 1) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            return this.dataSource.query(`SELECT v.id, v.folio, v.total, v.estado, v.created_at,
                v.usuario_nombre, v.cliente_nombre, v.metodo_pago
         FROM ventas v
         WHERE v.tenant_id=? AND v.tienda_id=? AND v.estado='completada'
           AND v.created_at >= ?
         ORDER BY v.created_at DESC LIMIT 30`, [scope.tenant_id, scope.tienda_id, hoy]);
        }
        const term = q.trim();
        const likeQ = `%${term}%`;
        const numQ = parseFloat(term) || null;
        return this.dataSource.query(`SELECT v.id, v.folio, v.total, v.estado, v.created_at,
              v.usuario_nombre, v.cliente_nombre, v.metodo_pago
       FROM ventas v
       WHERE v.tenant_id=? AND v.tienda_id=? AND v.estado='completada'
         AND (v.folio LIKE ? OR v.cliente_nombre LIKE ? ${numQ ? 'OR v.total = ?' : ''})
       ORDER BY v.created_at DESC LIMIT 20`, numQ
            ? [scope.tenant_id, scope.tienda_id, likeQ, likeQ, numQ]
            : [scope.tenant_id, scope.tienda_id, likeQ, likeQ]);
    }
    async getClientes(scope, q) {
        const likeV = q && q.length >= 2 ? 'AND v.cliente_telefono LIKE ?' : '';
        const likeP = q && q.length >= 2 ? 'AND p.cliente_telefono LIKE ?' : '';
        const qParams = [scope.tenant_id, scope.empresa_id];
        if (q && q.length >= 2)
            qParams.push(`${q}%`);
        qParams.push(scope.tenant_id, scope.empresa_id);
        if (q && q.length >= 2)
            qParams.push(`${q}%`);
        const rows = await this.dataSource.query(`SELECT
         telefono,
         MAX(nombre)            AS nombre,
         MAX(direccion)         AS direccion,
         COUNT(*)               AS total_compras,
         SUM(total)             AS total_gastado,
         MAX(ultima_visita)     AS ultima_visita,
         MIN(primera_visita)    AS primera_visita
       FROM (
         SELECT v.cliente_telefono AS telefono, v.cliente_nombre AS nombre,
                v.cliente_direccion AS direccion, v.total,
                v.created_at AS ultima_visita, v.created_at AS primera_visita
         FROM ventas v
         WHERE v.tenant_id = ? AND v.empresa_id = ?
           AND v.cliente_telefono IS NOT NULL AND v.cliente_telefono != ''
           ${likeV}
         UNION ALL
         SELECT p.cliente_telefono, p.cliente_nombre, p.cliente_direccion, p.total,
                p.created_at, p.created_at
         FROM pedidos p
         WHERE p.tenant_id = ? AND p.empresa_id = ?
           AND p.cliente_telefono IS NOT NULL AND p.cliente_telefono != ''
           ${likeP}
       ) t
       GROUP BY telefono
       ORDER BY total_gastado DESC
       LIMIT 500`, qParams);
        return rows.map((r) => ({
            telefono: r.telefono,
            nombre: r.nombre,
            direccion: r.direccion,
            total_compras: Number(r.total_compras),
            total_gastado: Number(r.total_gastado),
            ultima_visita: r.ultima_visita,
            primera_visita: r.primera_visita,
        }));
    }
    async sendStockAlerts(scope, folio) {
        const [tienda] = await this.dataSource.query('SELECT config_pos FROM tiendas WHERE id = ?', [scope.tienda_id]);
        const cp = tienda?.config_pos || {};
        if (!cp.whatsapp_enabled || !cp.whatsapp_phone || !cp.whatsapp_token)
            return;
        const lowStock = await this.dataSource.query(`SELECT nombre, stock_actual, stock_minimo, unidad
       FROM productos
       WHERE tenant_id = ? AND empresa_id = ? AND activo = 1
         AND controla_stock = 1 AND stock_minimo > 0
         AND stock_actual <= stock_minimo
       ORDER BY stock_actual ASC
       LIMIT 10`, [scope.tenant_id, scope.empresa_id]);
        if (!lowStock.length)
            return;
        const lineas = lowStock.map((p) => `• ${p.nombre}: ${Number(p.stock_actual)} ${p.unidad || 'pza'} (min ${Number(p.stock_minimo)})`).join('\n');
        const mensaje = `⚠️ STOCK BAJO — Venta ${folio}\n${lineas}`;
        await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': cp.whatsapp_token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                target: cp.whatsapp_phone,
                message: mensaje,
            }),
        });
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