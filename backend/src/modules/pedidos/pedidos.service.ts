import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Pedido, PedidoDetalle, PedidoEstado } from './pedido.entity';
import { VentasService } from '../ventas/ventas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class PedidosService {
  private logger = new Logger('PedidosService');

  constructor(
    @InjectRepository(Pedido) private pedidosRepo: Repository<Pedido>,
    private ventasService: VentasService,
    private notificacionesService: NotificacionesService,
  ) {}

  async crear(data: any, scope: any) {
    const folio = `P-${Date.now().toString(36).toUpperCase()}`;

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
    if (pedido.venta_id) throw new BadRequestException('Pedido ya cobrado');
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

    this.notificacionesService.emitToTienda(scope.tienda_id, 'pedido_cobrado', {
      pedido_id: pedido.id,
      venta_id: venta.id,
      folio: pedido.folio,
      mesa: pedido.mesa,
    });

    this.logger.log(`Pedido ${pedido.folio} cobrado - Venta ${venta.folio}`);
    return { pedido, venta };
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
}
