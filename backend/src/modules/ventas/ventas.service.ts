import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Venta, VentaDetalle, VentaPago, VentaEstado } from './venta.entity';
import { Auditoria } from './auditoria.entity';
import { Caja, CajaEstado } from '../caja/caja.entity';
import { EmpresasService } from '../empresas/empresas.service';
import { ApartadosService } from '../apartados/apartados.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class VentasService {
  private logger = new Logger('VentasService');

  constructor(
    @InjectRepository(Venta) private ventasRepo: Repository<Venta>,
    @InjectRepository(Auditoria) private auditoriaRepo: Repository<Auditoria>,
    @InjectRepository(Caja) private cajaRepo: Repository<Caja>,
    @InjectDataSource() private dataSource: DataSource,
    private empresasService: EmpresasService,
    private apartadosService: ApartadosService,
  ) {}

  private async generateFolio(tienda_id: number): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const [tienda] = await manager.query(
        'SELECT folio_venta_counter, nombre FROM tiendas WHERE id = ? FOR UPDATE',
        [tienda_id],
      );
      const newCounter = (tienda?.folio_venta_counter || 0) + 1;
      await manager.query(
        'UPDATE tiendas SET folio_venta_counter = ? WHERE id = ?',
        [newCounter, tienda_id],
      );
      const initial = (tienda?.nombre || 'X')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '')
        .charAt(0).toUpperCase() || 'X';
      return `I${initial}${String(newCounter).padStart(8, '0')}`;
    });
  }

  async crear(data: any, scope: any) {
    const caja = await this.cajaRepo.findOne({
      where: { id: data.caja_id, estado: CajaEstado.ABIERTA },
    });
    if (!caja) throw new BadRequestException('La caja no está abierta');

    // Con "inventario compartido" activo, el stock que manda es el de ESTA tienda
    // (producto_tienda.stock) en vez del acumulado de la empresa (productos.stock_actual).
    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);

    // Validate stock before committing the sale
    for (const item of data.items || []) {
      if (!item.producto_id || !item.cantidad) continue;
      if (inventario_compartido) {
        // apartado_tienda_id: el cashier eligio surtir este renglon desde otra tienda de la
        // empresa (stock local insuficiente) — validar stock ALLA, no aqui.
        const tiendaAValidar = item.apartado_tienda_id || scope.tienda_id;
        const [prod] = await this.dataSource.query(
          `SELECT p.controla_stock, p.nombre, COALESCE(pt.stock, 0) AS stock_actual
             FROM productos p
             LEFT JOIN producto_tienda pt ON pt.producto_id = p.id AND pt.tienda_id = ?
            WHERE p.id = ? AND p.tenant_id = ?`,
          [tiendaAValidar, item.producto_id, scope.tenant_id],
        );
        if (prod?.controla_stock && Number(prod.stock_actual) < Number(item.cantidad)) {
          throw new BadRequestException(
            item.apartado_tienda_id
              ? `Stock insuficiente en la tienda seleccionada para apartar "${prod.nombre}": disponible ${Number(prod.stock_actual)}, solicitado ${item.cantidad}`
              : `Stock insuficiente en esta tienda para "${prod.nombre}": disponible ${Number(prod.stock_actual)}, solicitado ${item.cantidad}`,
          );
        }
      } else {
        const [prod] = await this.dataSource.query(
          'SELECT controla_stock, stock_actual, nombre FROM productos WHERE id = ? AND tenant_id = ?',
          [item.producto_id, scope.tenant_id],
        );
        if (prod?.controla_stock && Number(prod.stock_actual) < Number(item.cantidad)) {
          throw new BadRequestException(
            `Stock insuficiente para "${prod.nombre}": disponible ${Number(prod.stock_actual)}, solicitado ${item.cantidad}`,
          );
        }
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
      pagos: data.pagos || [],
    });

    const saved = await this.ventasRepo.save(venta);

    // Actualizar totales de caja
    caja.total_ventas = Number(caja.total_ventas) + Number(data.total);
    await this.cajaRepo.save(caja);

    // Descontar stock para productos que controlan inventario
    let apartadoIndex = 0;
    for (const item of data.items || []) {
      if (!item.producto_id || !item.cantidad) continue;
      try {
        await this.dataSource.transaction(async (manager) => {
          const [prod] = await manager.query(
            'SELECT id, controla_stock, stock_actual, nombre, sku FROM productos WHERE id = ? AND tenant_id = ? FOR UPDATE',
            [item.producto_id, scope.tenant_id],
          );
          if (!prod?.controla_stock) return;
          let stockAnterior: number;
          let stockNuevo: number;
          if (inventario_compartido) {
            // Si el renglon se aparto en otra tienda, el stock que se descuenta es el de ALLA
            // (donde fisicamente esta el producto), no el de la tienda donde se cobro.
            const tiendaStock = item.apartado_tienda_id || scope.tienda_id;
            const [pt] = await manager.query(
              'SELECT id, stock FROM producto_tienda WHERE producto_id = ? AND tienda_id = ? FOR UPDATE',
              [prod.id, tiendaStock],
            );
            stockAnterior = Number(pt?.stock || 0);
            stockNuevo = stockAnterior - Number(item.cantidad);
            if (pt) {
              await manager.query('UPDATE producto_tienda SET stock = ? WHERE id = ?', [stockNuevo, pt.id]);
            } else {
              await manager.query(
                'INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, stock, disponible) VALUES (?, ?, ?, ?, 1)',
                [scope.tenant_id, tiendaStock, prod.id, stockNuevo],
              );
            }
            await manager.query(
              `INSERT INTO movimientos_inventario
                (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
                 tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
               VALUES (?, ?, ?, ?, ?, ?, 'salida', ?, ?, ?, ?, ?, ?)`,
              [
                scope.tenant_id, scope.empresa_id, tiendaStock,
                prod.id, prod.nombre, prod.sku,
                Number(item.cantidad), stockAnterior, stockNuevo,
                item.apartado_tienda_id ? `Apartado de venta ${folio}` : `Venta ${folio}`,
                scope.id || scope.sub,
                scope.nombre || 'Sistema',
              ],
            );
            if (item.apartado_tienda_id) {
              apartadoIndex++;
              const folioApartado = apartadoIndex === 1 ? folio : `${folio}-${apartadoIndex}`;
              await this.apartadosService.crearDentroDeTransaccion(manager, {
                tenant_id: scope.tenant_id,
                empresa_id: scope.empresa_id,
                tienda_origen_id: scope.tienda_id,
                tienda_destino_id: item.apartado_tienda_id,
                venta_id: saved.id,
                folio: folioApartado,
                producto_id: prod.id,
                producto_nombre: prod.nombre,
                cantidad: Number(item.cantidad),
                cliente_nombre: data.cliente_nombre,
                cliente_telefono: data.cliente_telefono,
                usuario_creo_id: scope.id || scope.sub,
                usuario_creo_nombre: scope.nombre || 'Sistema',
              });
            }
            return;
          }
          stockAnterior = Number(prod.stock_actual || 0);
          stockNuevo = stockAnterior - Number(item.cantidad);
          await manager.query(
            'UPDATE productos SET stock_actual = ? WHERE id = ?',
            [stockNuevo, prod.id],
          );
          await manager.query(
            `INSERT INTO movimientos_inventario
              (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
               tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
             VALUES (?, ?, ?, ?, ?, ?, 'salida', ?, ?, ?, ?, ?, ?)`,
            [
              scope.tenant_id, scope.empresa_id, scope.tienda_id,
              prod.id, prod.nombre, prod.sku,
              Number(item.cantidad), stockAnterior, stockNuevo,
              `Venta ${folio}`,
              scope.id || scope.sub,
              scope.nombre || 'Sistema',
            ],
          );
        });
      } catch (e: any) {
        // No abortar la venta por error de inventario — solo loguear
        this.logger.error(`Error descontando stock producto ${item.producto_id}: ${e?.message}`, e?.stack);
      }
    }

    // WhatsApp stock-low alerts via Fonnte
    try {
      await this.sendStockAlerts(scope, folio);
    } catch (e: any) {
      this.logger.warn(`WhatsApp alert error: ${e?.message}`);
    }

    // Auditoría
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

  async cancelar(id: number, motivo: string, scope: any) {
    const venta = await this.ventasRepo.findOne({ where: { id }, relations: ['detalles'] });
    if (!venta) throw new BadRequestException('Venta no encontrada');
    if (venta.estado === VentaEstado.CANCELADA) throw new BadRequestException('Ya está cancelada');

    venta.estado = VentaEstado.CANCELADA;
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
      datos_anteriores: { estado: VentaEstado.COMPLETADA },
      datos_nuevos: { estado: VentaEstado.CANCELADA, motivo },
    }));

    return saved;
  }

  findAll(scope: any, fecha_inicio?: string, fecha_fin?: string) {
    const where: any = {
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      tienda_id: scope.tienda_id,
    };
    if (fecha_inicio && fecha_fin) {
      where.created_at = Between(new Date(fecha_inicio), new Date(fecha_fin));
    }
    return this.ventasRepo.find({ where, relations: ['detalles'], order: { created_at: 'DESC' }, take: 100 });
  }

  findOne(id: number) {
    return this.ventasRepo.findOne({ where: { id }, relations: ['detalles', 'pagos'] });
  }

  async buscar(scope: any, q: string) {
    try {
      if (!q || q.trim().length < 1) {
        // Sin query: devuelve las últimas 30 ventas completadas del día
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        return await this.dataSource.query(
          `SELECT v.id, v.folio, v.total, v.estado, v.created_at,
                  u.nombre AS usuario_nombre, v.cliente_nombre, v.metodo_pago
           FROM ventas v
           LEFT JOIN users u ON u.id = v.usuario_id
           WHERE v.tenant_id=? AND v.tienda_id=? AND v.estado='completada'
             AND v.created_at >= ?
           ORDER BY v.created_at DESC LIMIT 30`,
          [scope.tenant_id ?? null, scope.tienda_id ?? null, hoy],
        );
      }
      const term = q.trim();
      const likeQ = `%${term}%`;
      const numQ = parseFloat(term) || null;
      return await this.dataSource.query(
        `SELECT v.id, v.folio, v.total, v.estado, v.created_at,
                u.nombre AS usuario_nombre, v.cliente_nombre, v.metodo_pago
         FROM ventas v
         LEFT JOIN users u ON u.id = v.usuario_id
         WHERE v.tenant_id=? AND v.tienda_id=? AND v.estado='completada'
           AND (v.folio LIKE ? OR v.cliente_nombre LIKE ? ${numQ ? 'OR v.total = ?' : ''})
         ORDER BY v.created_at DESC LIMIT 20`,
        numQ
          ? [scope.tenant_id ?? null, scope.tienda_id ?? null, likeQ, likeQ, numQ]
          : [scope.tenant_id ?? null, scope.tienda_id ?? null, likeQ, likeQ],
      );
    } catch (e: any) {
      this.logger.error(`Error en buscar ventas (q="${q}"): ${e?.message}`, e?.stack);
      throw new InternalServerErrorException(`Error buscando ventas: ${e?.message}`);
    }
  }

  async getClientes(scope: any, q?: string) {
    const likeV = q && q.length >= 2 ? 'AND v.cliente_telefono LIKE ?' : '';
    const likeP = q && q.length >= 2 ? 'AND p.cliente_telefono LIKE ?' : '';
    const qParams: any[] = [scope.tenant_id, scope.empresa_id];
    if (q && q.length >= 2) qParams.push(`${q}%`);
    qParams.push(scope.tenant_id, scope.empresa_id);
    if (q && q.length >= 2) qParams.push(`${q}%`);

    const rows = await this.dataSource.query(
      `SELECT
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
       LIMIT 500`,
      qParams,
    );
    return rows.map((r: any) => ({
      telefono: r.telefono,
      nombre: r.nombre,
      direccion: r.direccion,
      total_compras: Number(r.total_compras),
      total_gastado: Number(r.total_gastado),
      ultima_visita: r.ultima_visita,
      primera_visita: r.primera_visita,
    }));
  }

  private async sendStockAlerts(scope: any, folio: string) {
    // Load tienda config_pos for WhatsApp settings
    const [tienda] = await this.dataSource.query(
      'SELECT config_pos FROM tiendas WHERE id = ?',
      [scope.tienda_id],
    );
    const cp = tienda?.config_pos || {};
    if (!cp.whatsapp_enabled || !cp.whatsapp_phone || !cp.whatsapp_token) return;

    // Find products that just dropped below minimum
    const lowStock = await this.dataSource.query(
      `SELECT nombre, stock_actual, stock_minimo, unidad
       FROM productos
       WHERE tenant_id = ? AND empresa_id = ? AND activo = 1
         AND controla_stock = 1 AND stock_minimo > 0
         AND stock_actual <= stock_minimo
       ORDER BY stock_actual ASC
       LIMIT 10`,
      [scope.tenant_id, scope.empresa_id],
    );
    if (!lowStock.length) return;

    const lineas = lowStock.map((p: any) =>
      `• ${p.nombre}: ${Number(p.stock_actual)} ${p.unidad || 'pza'} (min ${Number(p.stock_minimo)})`,
    ).join('\n');
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

  // Sync offline sales
  async syncOffline(ventas: any[], scope: any) {
    const results: any[] = [];
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
}
