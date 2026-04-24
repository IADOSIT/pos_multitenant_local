import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Devolucion } from './devolucion.entity';

@Injectable()
export class DevolucionesService {
  private readonly logger = new Logger('DevolucionesService');

  constructor(
    @InjectRepository(Devolucion) private repo: Repository<Devolucion>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  private generateFolio(): string {
    return 'DEV-' + Date.now().toString(36).toUpperCase();
  }

  async findByVenta(ventaId: number, scope: any): Promise<Devolucion[]> {
    return this.repo.find({
      where: { venta_id: ventaId, tenant_id: scope.tenant_id },
      order: { created_at: 'DESC' },
    });
  }

  async findAll(scope: any, desde?: string, hasta?: string): Promise<Devolucion[]> {
    let query = this.repo.createQueryBuilder('d')
      .where('d.tenant_id = :tid AND d.tienda_id = :sid', {
        tid: scope.tenant_id,
        sid: scope.tienda_id,
      });
    if (desde) query = query.andWhere('d.created_at >= :desde', { desde });
    if (hasta) query = query.andWhere('d.created_at <= :hasta', { hasta: `${hasta} 23:59:59` });
    return query.orderBy('d.created_at', 'DESC').getMany();
  }

  async crear(dto: {
    venta_id: number;
    motivo?: string;
    items: { producto_id: number; cantidad: number }[];
  }, scope: any): Promise<Devolucion> {

    // 1. Cargar venta original
    const [venta] = await this.dataSource.query(
      `SELECT v.id, v.folio, v.estado, v.tenant_id, v.tienda_id
       FROM ventas v WHERE v.id = ? AND v.tenant_id = ?`,
      [dto.venta_id, scope.tenant_id],
    );
    if (!venta) throw new NotFoundException('Venta no encontrada');
    if (venta.estado === 'cancelada') throw new BadRequestException('No se puede devolver una venta cancelada');

    // 2. Cargar detalles de la venta
    const detalles: any[] = await this.dataSource.query(
      `SELECT vd.producto_id, vd.producto_nombre, vd.producto_sku,
              vd.cantidad, vd.precio_unitario
       FROM venta_detalles vd WHERE vd.venta_id = ?`,
      [dto.venta_id],
    );

    // 3. Calcular ya devuelto por item
    const devueltoMap: Record<number, number> = {};
    const devolucionesExistentes = await this.repo.find({ where: { venta_id: dto.venta_id } });
    for (const dev of devolucionesExistentes) {
      for (const item of dev.items) {
        devueltoMap[item.producto_id] = (devueltoMap[item.producto_id] || 0) + Number(item.cantidad);
      }
    }

    // 4. Validar cantidades y construir items de devolución
    const itemsDevolucion: Devolucion['items'] = [];
    let montoTotal = 0;

    for (const itemDto of dto.items) {
      if (!itemDto.cantidad || itemDto.cantidad <= 0) continue;

      const detalle = detalles.find(d => Number(d.producto_id) === Number(itemDto.producto_id));
      if (!detalle) throw new BadRequestException(`Producto ${itemDto.producto_id} no está en la venta`);

      const yaDevueltoCantidad = devueltoMap[itemDto.producto_id] || 0;
      const disponible = Number(detalle.cantidad) - yaDevueltoCantidad;

      if (itemDto.cantidad > disponible) {
        throw new BadRequestException(
          `"${detalle.producto_nombre}": máximo a devolver es ${disponible} (ya se devolvieron ${yaDevueltoCantidad})`
        );
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

    if (!itemsDevolucion.length) throw new BadRequestException('No hay ítems válidos para devolver');

    // 5. Crear registro de devolución
    const entity = new Devolucion();
    entity.tenant_id = scope.tenant_id;
    entity.empresa_id = scope.empresa_id;
    entity.tienda_id = scope.tienda_id;
    entity.venta_id = dto.venta_id;
    entity.folio = this.generateFolio();
    entity.venta_folio = venta.folio;
    entity.usuario_id = scope.id || scope.sub;
    entity.usuario_nombre = scope.nombre || 'Sistema';
    if (dto.motivo) entity.motivo = dto.motivo;
    entity.items = itemsDevolucion;
    entity.monto_total = montoTotal;
    const devolucion = await this.repo.save(entity);

    // 6. Reponer stock para ítems que controlan inventario
    for (const item of itemsDevolucion) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const [prod] = await manager.query(
            'SELECT id, controla_stock, stock_actual, nombre, sku FROM productos WHERE id = ? AND tenant_id = ? FOR UPDATE',
            [item.producto_id, scope.tenant_id],
          );
          if (!prod?.controla_stock) return;

          const stockAnterior = Number(prod.stock_actual || 0);
          const stockNuevo = stockAnterior + Number(item.cantidad);

          await manager.query(
            'UPDATE productos SET stock_actual = ? WHERE id = ?',
            [stockNuevo, prod.id],
          );
          await manager.query(
            `INSERT INTO movimientos_inventario
              (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
               tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
             VALUES (?, ?, ?, ?, ?, ?, 'entrada', ?, ?, ?, ?, ?, ?)`,
            [
              scope.tenant_id, scope.empresa_id, scope.tienda_id,
              prod.id, prod.nombre, prod.sku,
              Number(item.cantidad), stockAnterior, stockNuevo,
              `Devolución ${devolucion.folio} (Venta ${venta.folio})`,
              scope.id || scope.sub,
              scope.nombre || 'Sistema',
            ],
          );
        });
      } catch (e: any) {
        this.logger.error(`Error reponiendo stock producto ${item.producto_id}: ${e?.message}`);
      }
    }

    // 7. Registrar salida en caja activa (si hay una abierta)
    try {
      const [cajaAbierta] = await this.dataSource.query(
        `SELECT id, total_salidas FROM cajas WHERE tienda_id = ? AND estado = 'abierta' LIMIT 1`,
        [scope.tienda_id],
      );
      if (cajaAbierta) {
        const concepto = `Devolución ${devolucion.folio} (Venta ${venta.folio})`.slice(0, 200);
        await this.dataSource.query(
          `INSERT INTO movimientos_caja (caja_id, usuario_id, tipo, monto, concepto)
           VALUES (?, ?, 'salida', ?, ?)`,
          [cajaAbierta.id, scope.id || scope.sub, montoTotal, concepto],
        );
        await this.dataSource.query(
          `UPDATE cajas SET total_salidas = total_salidas + ? WHERE id = ?`,
          [montoTotal, cajaAbierta.id],
        );
        this.logger.log(`Caja ${cajaAbierta.id}: salida $${montoTotal.toFixed(2)} por devolución ${devolucion.folio}`);
      }
    } catch (e: any) {
      this.logger.error(`Error actualizando caja tras devolución: ${e?.message}`);
    }

    this.logger.log(`Devolución ${devolucion.folio} creada — Venta ${venta.folio} — $${montoTotal.toFixed(2)}`);
    return devolucion;
  }

  async findOne(id: number, scope: any): Promise<Devolucion> {
    const dev = await this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
    if (!dev) throw new NotFoundException('Devolución no encontrada');
    return dev;
  }
}
