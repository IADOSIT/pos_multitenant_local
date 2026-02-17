import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Venta, VentaDetalle, VentaPago, VentaEstado } from './venta.entity';
import { Auditoria } from './auditoria.entity';
import { Caja, CajaEstado } from '../caja/caja.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta) private ventasRepo: Repository<Venta>,
    @InjectRepository(Auditoria) private auditoriaRepo: Repository<Auditoria>,
    @InjectRepository(Caja) private cajaRepo: Repository<Caja>,
  ) {}

  async crear(data: any, scope: any) {
    const caja = await this.cajaRepo.findOne({
      where: { id: data.caja_id, estado: CajaEstado.ABIERTA },
    });
    if (!caja) throw new BadRequestException('La caja no está abierta');

    const folio = `V-${Date.now().toString(36).toUpperCase()}`;

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

  // Sync offline sales
  async syncOffline(ventas: any[], scope: any) {
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
}
