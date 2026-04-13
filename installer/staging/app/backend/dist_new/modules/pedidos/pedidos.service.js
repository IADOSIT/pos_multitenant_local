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
exports.PedidosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pedido_entity_1 = require("./pedido.entity");
const ventas_service_1 = require("../ventas/ventas.service");
const notificaciones_service_1 = require("../notificaciones/notificaciones.service");
let PedidosService = class PedidosService {
    constructor(pedidosRepo, ventasService, notificacionesService, dataSource, selfOrderService) {
        this.pedidosRepo = pedidosRepo;
        this.ventasService = ventasService;
        this.notificacionesService = notificacionesService;
        this.dataSource = dataSource;
        this.selfOrderService = selfOrderService;
        this.logger = new common_1.Logger('PedidosService');
    }
    async generateFolio(tienda_id) {
        return this.dataSource.transaction(async (manager) => {
            const [tienda] = await manager.query('SELECT folio_pedido_counter, nombre FROM tiendas WHERE id = ? FOR UPDATE', [tienda_id]);
            const newCounter = (tienda?.folio_pedido_counter || 0) + 1;
            await manager.query('UPDATE tiendas SET folio_pedido_counter = ? WHERE id = ?', [newCounter, tienda_id]);
            const initial = (tienda?.nombre || 'X')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '')
                .charAt(0).toUpperCase() || 'X';
            return `I${initial}${String(newCounter).padStart(8, '0')}`;
        });
    }
    async crear(data, scope) {
        const folio = await this.generateFolio(scope.tienda_id);
        const pedido = this.pedidosRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
            usuario_id: scope.id || scope.sub,
            usuario_nombre: scope.nombre,
            folio,
            mesa: data.mesa,
            subtotal: data.subtotal,
            descuento: data.descuento || 0,
            impuestos: data.impuestos || 0,
            total: data.total,
            notas: data.notas,
            cliente_nombre: data.cliente_nombre,
            cliente_telefono: data.cliente_telefono,
            cliente_direccion: data.cliente_direccion,
            tipo_servicio: data.tipo_servicio || 'en_sitio',
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
        });
        const saved = await this.pedidosRepo.save(pedido);
        const full = await this.findOne(saved.id);
        this.notificacionesService.emitToTienda(scope.tienda_id, 'nuevo_pedido', {
            id: full.id,
            folio: full.folio,
            mesa: full.mesa,
            total: full.total,
            items: full.detalles?.length || 0,
            usuario_nombre: full.usuario_nombre,
            created_at: full.created_at,
        });
        this.logger.log(`Pedido ${folio} creado - Mesa ${data.mesa} - $${data.total}`);
        return full;
    }
    findAll(scope, estado) {
        const where = {
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
        };
        if (estado)
            where.estado = estado;
        return this.pedidosRepo.find({
            where,
            relations: ['detalles'],
            order: { created_at: 'DESC' },
            take: 100,
        });
    }
    findPendientes(scope) {
        return this.pedidosRepo.find({
            where: {
                tenant_id: scope.tenant_id,
                empresa_id: scope.empresa_id,
                tienda_id: scope.tienda_id,
                estado: (0, typeorm_2.In)([pedido_entity_1.PedidoEstado.RECIBIDO, pedido_entity_1.PedidoEstado.EN_ELABORACION, pedido_entity_1.PedidoEstado.LISTO_PARA_ENTREGA]),
            },
            relations: ['detalles'],
            order: { created_at: 'ASC' },
        });
    }
    async countPendientes(scope) {
        const count = await this.pedidosRepo.count({
            where: {
                tenant_id: scope.tenant_id,
                empresa_id: scope.empresa_id,
                tienda_id: scope.tienda_id,
                estado: (0, typeorm_2.In)([pedido_entity_1.PedidoEstado.RECIBIDO, pedido_entity_1.PedidoEstado.EN_ELABORACION, pedido_entity_1.PedidoEstado.LISTO_PARA_ENTREGA]),
            },
        });
        return { count };
    }
    findOne(id) {
        return this.pedidosRepo.findOne({ where: { id }, relations: ['detalles'] });
    }
    async updateEstado(id, nuevoEstado, scope) {
        const pedido = await this.findOne(id);
        if (!pedido)
            throw new common_1.BadRequestException('Pedido no encontrado');
        const transitions = {
            [pedido_entity_1.PedidoEstado.RECIBIDO]: [pedido_entity_1.PedidoEstado.EN_ELABORACION, pedido_entity_1.PedidoEstado.CANCELADO],
            [pedido_entity_1.PedidoEstado.EN_ELABORACION]: [pedido_entity_1.PedidoEstado.LISTO_PARA_ENTREGA, pedido_entity_1.PedidoEstado.CANCELADO],
            [pedido_entity_1.PedidoEstado.LISTO_PARA_ENTREGA]: [pedido_entity_1.PedidoEstado.ENTREGADO, pedido_entity_1.PedidoEstado.CANCELADO],
        };
        const allowed = transitions[pedido.estado] || [];
        if (!allowed.includes(nuevoEstado)) {
            throw new common_1.BadRequestException(`No se puede cambiar de ${pedido.estado} a ${nuevoEstado}`);
        }
        pedido.estado = nuevoEstado;
        const saved = await this.pedidosRepo.save(pedido);
        this.notificacionesService.emitToTienda(scope.tienda_id, 'pedido_actualizado', {
            id: saved.id,
            folio: saved.folio,
            mesa: saved.mesa,
            estado: saved.estado,
        });
        return saved;
    }
    async cobrar(id, pagoData, scope) {
        const pedido = await this.findOne(id);
        if (!pedido)
            throw new common_1.BadRequestException('Pedido no encontrado');
        if (pedido.venta_id && !pedido.cuenta_abierta)
            throw new common_1.BadRequestException('Pedido ya cobrado');
        if (pedido.estado === pedido_entity_1.PedidoEstado.CANCELADO)
            throw new common_1.BadRequestException('Pedido cancelado');
        const ventaData = {
            caja_id: pagoData.caja_id,
            items: pedido.detalles.map((d) => ({
                producto_id: d.producto_id,
                nombre: d.producto_nombre,
                sku: d.producto_sku,
                precio: Number(d.precio_unitario),
                cantidad: Number(d.cantidad),
                descuento: Number(d.descuento),
                impuesto: Number(d.impuesto),
                modificadores: d.modificadores,
                notas: d.notas,
            })),
            subtotal: Number(pedido.subtotal),
            descuento: Number(pedido.descuento),
            impuestos: Number(pedido.impuestos),
            total: Number(pedido.total),
            metodo_pago: pagoData.metodo_pago,
            pago_efectivo: pagoData.pago_efectivo,
            pago_tarjeta: pagoData.pago_tarjeta,
            pago_transferencia: pagoData.pago_transferencia,
            cambio: pagoData.cambio || 0,
            notas: `Mesa ${pedido.mesa}${pedido.notas ? ' | ' + pedido.notas : ''}`,
            cliente_nombre: pedido.cliente_nombre,
            cliente_telefono: pedido.cliente_telefono,
            cliente_direccion: pedido.cliente_direccion,
            tipo_servicio: pedido.tipo_servicio,
            pagos: pagoData.pagos || [],
        };
        const venta = await this.ventasService.crear(ventaData, scope);
        venta.pedido_id = pedido.id;
        await this.pedidosRepo.manager.getRepository('Venta').save(venta);
        pedido.venta_id = venta.id;
        pedido.estado = pedido_entity_1.PedidoEstado.ENTREGADO;
        await this.pedidosRepo.save(pedido);
        if (pedido.self_order && this.selfOrderService) {
            await this.selfOrderService.crearEncuestaAlCobrar(pedido);
        }
        this.notificacionesService.emitToTienda(scope.tienda_id, 'pedido_cobrado', {
            pedido_id: pedido.id,
            venta_id: venta.id,
            folio: pedido.folio,
            mesa: pedido.mesa,
            encuesta_token: pedido.self_order ? pedido.encuesta_token : undefined,
        });
        this.logger.log(`Pedido ${pedido.folio} cobrado - Venta ${venta.folio}`);
        return { pedido, venta };
    }
    async cobrarParcial(id, pagoData, scope) {
        const pedido = await this.findOne(id);
        if (!pedido)
            throw new common_1.BadRequestException('Pedido no encontrado');
        if (pedido.estado === pedido_entity_1.PedidoEstado.CANCELADO)
            throw new common_1.BadRequestException('Pedido cancelado');
        if (pedido.estado === pedido_entity_1.PedidoEstado.ENTREGADO)
            throw new common_1.BadRequestException('Pedido ya cerrado');
        const ventaData = {
            caja_id: pagoData.caja_id,
            items: pedido.detalles.map((d) => ({
                producto_id: d.producto_id,
                nombre: d.producto_nombre,
                sku: d.producto_sku,
                precio: Number(d.precio_unitario),
                cantidad: Number(d.cantidad),
                descuento: Number(d.descuento),
                impuesto: Number(d.impuesto),
                modificadores: d.modificadores,
                notas: d.notas,
            })),
            subtotal: Number(pedido.subtotal),
            descuento: Number(pedido.descuento),
            impuestos: Number(pedido.impuestos),
            total: Number(pedido.total),
            metodo_pago: pagoData.metodo_pago,
            pago_efectivo: pagoData.pago_efectivo,
            pago_tarjeta: pagoData.pago_tarjeta,
            pago_transferencia: pagoData.pago_transferencia,
            cambio: pagoData.cambio || 0,
            notas: `Mesa ${pedido.mesa} - Pago parcial${pedido.notas ? ' | ' + pedido.notas : ''}`,
            cliente_nombre: pedido.cliente_nombre,
            cliente_telefono: pedido.cliente_telefono,
            cliente_direccion: pedido.cliente_direccion,
            tipo_servicio: pedido.tipo_servicio,
            pagos: pagoData.pagos || [],
        };
        const venta = await this.ventasService.crear(ventaData, scope);
        venta.pedido_id = pedido.id;
        await this.pedidosRepo.manager.getRepository('Venta').save(venta);
        pedido.cuenta_abierta = true;
        await this.pedidosRepo.save(pedido);
        this.logger.log(`Pedido ${pedido.folio} - pago parcial - Venta ${venta.folio}`);
        return { pedido, venta };
    }
    async actualizarItems(id, data) {
        try {
            const pedido = await this.findOne(id);
            if (!pedido)
                throw new common_1.BadRequestException('Pedido no encontrado');
            if (pedido.estado === pedido_entity_1.PedidoEstado.ENTREGADO)
                throw new common_1.BadRequestException('Pedido ya cerrado');
            if (pedido.estado === pedido_entity_1.PedidoEstado.CANCELADO)
                throw new common_1.BadRequestException('Pedido cancelado');
            await this.dataSource.query('DELETE FROM pedido_detalles WHERE pedido_id = ?', [id]);
            for (const item of data.items) {
                await this.dataSource.query(`INSERT INTO pedido_detalles
            (pedido_id, producto_id, producto_nombre, producto_sku, cantidad, precio_unitario, descuento, impuesto, subtotal, modificadores, notas)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    id,
                    item.producto_id,
                    item.nombre,
                    item.sku,
                    item.cantidad,
                    item.precio,
                    item.descuento || 0,
                    item.impuesto || 0,
                    item.cantidad * item.precio - (item.descuento || 0),
                    item.modificadores ? JSON.stringify(item.modificadores) : null,
                    item.notas || null,
                ]);
            }
            const updateFields = {
                subtotal: data.subtotal,
                impuestos: data.impuestos || 0,
                total: data.total,
            };
            if (data.notas !== undefined)
                updateFields.notas = data.notas;
            if (data.cliente_nombre !== undefined)
                updateFields.cliente_nombre = data.cliente_nombre;
            if (data.cliente_telefono !== undefined)
                updateFields.cliente_telefono = data.cliente_telefono;
            if (data.cliente_direccion !== undefined)
                updateFields.cliente_direccion = data.cliente_direccion;
            await this.pedidosRepo.update(id, updateFields);
            this.logger.log(`Pedido ${pedido.folio} items actualizados - $${data.total}`);
            return this.findOne(id);
        }
        catch (e) {
            this.logger.error('actualizarItems error:', e?.message, e?.stack);
            throw new common_1.BadRequestException(`Error actualizando pedido: ${e?.message || e}`);
        }
    }
    async cancelar(id, motivo, scope) {
        const pedido = await this.findOne(id);
        if (!pedido)
            throw new common_1.BadRequestException('Pedido no encontrado');
        if (pedido.estado === pedido_entity_1.PedidoEstado.ENTREGADO)
            throw new common_1.BadRequestException('Pedido ya entregado');
        if (pedido.estado === pedido_entity_1.PedidoEstado.CANCELADO)
            throw new common_1.BadRequestException('Pedido ya cancelado');
        pedido.estado = pedido_entity_1.PedidoEstado.CANCELADO;
        pedido.notas = `${pedido.notas || ''} | CANCELADO: ${motivo}`;
        const saved = await this.pedidosRepo.save(pedido);
        this.notificacionesService.emitToTienda(scope.tienda_id, 'pedido_actualizado', {
            id: saved.id,
            folio: saved.folio,
            mesa: saved.mesa,
            estado: saved.estado,
        });
        return saved;
    }
};
exports.PedidosService = PedidosService;
exports.PedidosService = PedidosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pedido_entity_1.Pedido)),
    __param(3, (0, typeorm_1.InjectDataSource)()),
    __param(4, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        ventas_service_1.VentasService,
        notificaciones_service_1.NotificacionesService,
        typeorm_2.DataSource, Function])
], PedidosService);
//# sourceMappingURL=pedidos.service.js.map