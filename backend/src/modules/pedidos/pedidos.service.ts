import { Injectable, BadRequestException, Logger, Optional } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Pedido, PedidoDetalle, PedidoEstado } from './pedido.entity';
import { VentasService } from '../ventas/ventas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import type { SelfOrderService } from '../self-order/self-order.service';

@Injectable()
export class PedidosService {
  private logger = new Logger('PedidosService');

  constructor(
    @InjectRepository(Pedido) private pedidosRepo: Repository<Pedido>,
    private ventasService: VentasService,
    private notificacionesService: NotificacionesService,
    @InjectDataSource() private dataSource: DataSource,
    @Optional() private selfOrderService?: SelfOrderService,
  ) {}

  private async generateFolio(tienda_id: number): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const [tienda] = await manager.query(
        'SELECT folio_pedido_counter, nombre FROM tiendas WHERE id = ? FOR UPDATE',
        [tienda_id],
      );
      const newCounter = (tienda?.folio_pedido_counter || 0) + 1;
      await manager.query(
        'UPDATE tiendas SET folio_pedido_counter = ? WHERE id = ?',
        [newCounter, tienda_id],
      );
      const initial = (tienda?.nombre || 'X')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '')
        .charAt(0).toUpperCase() || 'X';
      return `I${initial}${String(newCounter).padStart(8, '0')}`;
    });
  }

  async crear(data: any, scope: any) {
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
      detalles: data.items.map((item: any) => ({
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

    // Emit SSE notification
    this.notificacionesService.emitToTienda(scope.tienda_id, 'nuevo_pedido', {
      id: full!.id,
      folio: full!.folio,
      mesa: full!.mesa,
      total: full!.total,
      items: full!.detalles?.length || 0,
      usuario_nombre: full!.usuario_nombre,
      created_at: full!.created_at,
    });

    this.logger.log(`Pedido ${folio} creado - Mesa ${data.mesa} - $${data.total}`);
    return full;
  }

  findAll(scope: any, estado?: string) {
    const where: any = {
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      tienda_id: scope.tienda_id,
    };
    if (estado) where.estado = estado;
    return this.pedidosRepo.find({
      where,
      relations: ['detalles'],
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  findPendientes(scope: any) {
    return this.pedidosRepo.find({
      where: {
        tenant_id: scope.tenant_id,
        empresa_id: scope.empresa_id,
        tienda_id: scope.tienda_id,
        estado: In([PedidoEstado.RECIBIDO, PedidoEstado.EN_ELABORACION, PedidoEstado.LISTO_PARA_ENTREGA]),
      },
      relations: ['detalles'],
      order: { created_at: 'ASC' },
    });
  }

  async countPendientes(scope: any) {
    const count = await this.pedidosRepo.count({
      where: {
        tenant_id: scope.tenant_id,
        empresa_id: scope.empresa_id,
        tienda_id: scope.tienda_id,
        estado: In([PedidoEstado.RECIBIDO, PedidoEstado.EN_ELABORACION, PedidoEstado.LISTO_PARA_ENTREGA]),
      },
    });
    return { count };
  }

  findOne(id: number) {
    return this.pedidosRepo.findOne({ where: { id }, relations: ['detalles'] });
  }

  async updateEstado(id: number, nuevoEstado: PedidoEstado, scope: any) {
    const pedido = await this.findOne(id);
    if (!pedido) throw new BadRequestException('Pedido no encontrado');

    const transitions: Record<string, string[]> = {
      [PedidoEstado.RECIBIDO]: [PedidoEstado.EN_ELABORACION, PedidoEstado.CANCELADO],
      [PedidoEstado.EN_ELABORACION]: [PedidoEstado.LISTO_PARA_ENTREGA, PedidoEstado.CANCELADO],
      [PedidoEstado.LISTO_PARA_ENTREGA]: [PedidoEstado.ENTREGADO, PedidoEstado.CANCELADO],
    };

    const allowed = transitions[pedido.estado] || [];
    if (!allowed.includes(nuevoEstado)) {
      throw new BadRequestException(`No se puede cambiar de ${pedido.estado} a ${nuevoEstado}`);
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

  async cobrar(id: number, pagoData: any, scope: any) {
    const pedido = await this.findOne(id);
    if (!pedido) throw new BadRequestException('Pedido no encontrado');
    if (pedido.venta_id && !pedido.cuenta_abierta) throw new BadRequestException('Pedido ya cobrado');
    if (pedido.estado === PedidoEstado.CANCELADO) throw new BadRequestException('Pedido cancelado');

    // Build venta data from pedido + payment info
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

    // Create venta using existing service
    const venta = await this.ventasService.crear(ventaData, scope);

    // Link venta to pedido
    venta.pedido_id = pedido.id;
    await this.pedidosRepo.manager.getRepository('Venta').save(venta);

    // Update pedido
    pedido.venta_id = venta.id;
    pedido.estado = PedidoEstado.ENTREGADO;
    await this.pedidosRepo.save(pedido);

    // Si es self-order, crear encuesta y notificar al cliente
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

  async cobrarParcial(id: number, pagoData: any, scope: any) {
    const pedido = await this.findOne(id);
    if (!pedido) throw new BadRequestException('Pedido no encontrado');
    if (pedido.estado === PedidoEstado.CANCELADO) throw new BadRequestException('Pedido cancelado');
    if (pedido.estado === PedidoEstado.ENTREGADO) throw new BadRequestException('Pedido ya cerrado');

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

    // Vincular venta al pedido (igual que cobrar() completo)
    venta.pedido_id = pedido.id;
    await this.pedidosRepo.manager.getRepository('Venta').save(venta);

    pedido.cuenta_abierta = true;
    await this.pedidosRepo.save(pedido);

    this.logger.log(`Pedido ${pedido.folio} - pago parcial - Venta ${venta.folio}`);
    return { pedido, venta };
  }

  async actualizarItems(id: number, data: any) {
    try {
      const pedido = await this.findOne(id);
      if (!pedido) throw new BadRequestException('Pedido no encontrado');
      if (pedido.estado === PedidoEstado.ENTREGADO) throw new BadRequestException('Pedido ya cerrado');
      if (pedido.estado === PedidoEstado.CANCELADO) throw new BadRequestException('Pedido cancelado');

      await this.dataSource.query('DELETE FROM pedido_detalles WHERE pedido_id = ?', [id]);

      for (const item of data.items) {
        await this.dataSource.query(
          `INSERT INTO pedido_detalles
            (pedido_id, producto_id, producto_nombre, producto_sku, cantidad, precio_unitario, descuento, impuesto, subtotal, modificadores, notas)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
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
          ],
        );
      }

      const updateFields: any = {
        subtotal: data.subtotal,
        impuestos: data.impuestos || 0,
        total: data.total,
      };
      if (data.notas !== undefined) updateFields.notas = data.notas;
      if (data.cliente_nombre !== undefined) updateFields.cliente_nombre = data.cliente_nombre;
      if (data.cliente_telefono !== undefined) updateFields.cliente_telefono = data.cliente_telefono;
      if (data.cliente_direccion !== undefined) updateFields.cliente_direccion = data.cliente_direccion;
      await this.pedidosRepo.update(id, updateFields);

      this.logger.log(`Pedido ${pedido.folio} items actualizados - $${data.total}`);
      return this.findOne(id);
    } catch (e: any) {
      this.logger.error('actualizarItems error:', e?.message, e?.stack);
      throw new BadRequestException(`Error actualizando pedido: ${e?.message || e}`);
    }
  }

  async cancelar(id: number, motivo: string, scope: any) {
    const pedido = await this.findOne(id);
    if (!pedido) throw new BadRequestException('Pedido no encontrado');
    if (pedido.estado === PedidoEstado.ENTREGADO) throw new BadRequestException('Pedido ya entregado');
    if (pedido.estado === PedidoEstado.CANCELADO) throw new BadRequestException('Pedido ya cancelado');

    pedido.estado = PedidoEstado.CANCELADO;
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

  async buscarClientes(scope: any, q: string) {
    if (q.length < 2) return [];
    const rows = await this.dataSource.query(
      `SELECT cliente_telefono AS telefono, cliente_nombre AS nombre, cliente_direccion AS direccion,
              MAX(created_at) AS ultima_visita
       FROM pedidos
       WHERE tenant_id = ? AND empresa_id = ?
         AND cliente_telefono IS NOT NULL AND cliente_telefono != ''
         AND cliente_telefono LIKE ?
       GROUP BY cliente_telefono, cliente_nombre, cliente_direccion
       ORDER BY ultima_visita DESC
       LIMIT 6`,
      [scope.tenant_id, scope.empresa_id, `${q}%`],
    );
    return rows;
  }
}
