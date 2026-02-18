import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caja, CajaEstado, MovimientoCaja, MovimientoCajaTipo } from './caja.entity';
import { Venta, VentaEstado } from '../ventas/venta.entity';

@Injectable()
export class CajaService {
  constructor(
    @InjectRepository(Caja) private cajaRepo: Repository<Caja>,
    @InjectRepository(MovimientoCaja) private movRepo: Repository<MovimientoCaja>,
    @InjectRepository(Venta) private ventaRepo: Repository<Venta>,
  ) {}

  async abrir(data: any, scope: any) {
    const abierta = await this.cajaRepo.findOne({
      where: { tienda_id: scope.tienda_id, estado: CajaEstado.ABIERTA },
    });
    if (abierta) throw new BadRequestException('Ya hay una caja abierta en esta tienda');

    return this.cajaRepo.save(this.cajaRepo.create({
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      tienda_id: scope.tienda_id,
      usuario_id: scope.id || scope.sub,
      nombre: data.nombre || `Caja-${Date.now()}`,
      estado: CajaEstado.ABIERTA,
      fondo_apertura: data.fondo || 0,
      fecha_apertura: new Date(),
    }));
  }

  async cerrar(id: number, data: any, scope: any) {
    const caja = await this.cajaRepo.findOne({ where: { id, estado: CajaEstado.ABIERTA } });
    if (!caja) throw new BadRequestException('Caja no encontrada o ya cerrada');

    // Calcular efectivo real en caja (pago_efectivo - cambio de cada venta)
    const ventas = await this.ventaRepo.find({
      where: { caja_id: id, estado: VentaEstado.COMPLETADA },
    });
    const efectivoNeto = ventas
      .filter(v => v.pago_efectivo)
      .reduce((s, v) => s + Number(v.pago_efectivo) - Number(v.cambio || 0), 0);

    caja.total_real = data.total_real || 0;
    caja.total_esperado = Number(caja.fondo_apertura) + efectivoNeto + Number(caja.total_entradas) - Number(caja.total_salidas);
    caja.diferencia = Number(caja.total_real) - Number(caja.total_esperado);
    caja.estado = CajaEstado.CERRADA;
    caja.fecha_cierre = new Date();
    caja.notas_cierre = data.notas || null;

    return this.cajaRepo.save(caja);
  }

  async movimiento(cajaId: number, data: any, scope: any) {
    const caja = await this.cajaRepo.findOne({ where: { id: cajaId, estado: CajaEstado.ABIERTA } });
    if (!caja) throw new BadRequestException('Caja no abierta');

    const mov = await this.movRepo.save(this.movRepo.create({
      caja_id: cajaId,
      usuario_id: scope.id || scope.sub,
      tipo: data.tipo,
      monto: data.monto,
      concepto: data.concepto,
      notas: data.notas,
    }));

    if (data.tipo === MovimientoCajaTipo.ENTRADA) {
      caja.total_entradas = Number(caja.total_entradas) + Number(data.monto);
    } else {
      caja.total_salidas = Number(caja.total_salidas) + Number(data.monto);
    }
    await this.cajaRepo.save(caja);

    return mov;
  }

  async corteX(id: number) {
    const caja = await this.cajaRepo.findOne({ where: { id }, relations: ['movimientos'] });
    if (!caja) throw new BadRequestException('Caja no encontrada');

    const ventas = await this.ventaRepo.find({
      where: { caja_id: id, estado: VentaEstado.COMPLETADA },
    });

    const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
    // Efectivo real = lo que se entregó - cambio devuelto
    const totalEfectivo = ventas.filter(v => v.pago_efectivo).reduce((sum, v) => sum + Number(v.pago_efectivo) - Number(v.cambio || 0), 0);
    const totalTarjeta = ventas.filter(v => v.pago_tarjeta).reduce((sum, v) => sum + Number(v.pago_tarjeta), 0);
    const totalTransferencia = ventas.filter(v => v.pago_transferencia).reduce((sum, v) => sum + Number(v.pago_transferencia), 0);

    return {
      caja,
      resumen: {
        num_ventas: ventas.length,
        total_ventas: totalVentas,
        total_efectivo: totalEfectivo,
        total_tarjeta: totalTarjeta,
        total_transferencia: totalTransferencia,
        total_entradas: caja.total_entradas,
        total_salidas: caja.total_salidas,
        esperado_en_caja: Number(caja.fondo_apertura) + totalEfectivo + Number(caja.total_entradas) - Number(caja.total_salidas),
      },
    };
  }

  async reporteCaja(id: number) {
    const caja = await this.cajaRepo.findOne({ where: { id }, relations: ['movimientos'] });
    if (!caja) throw new BadRequestException('Caja no encontrada');

    const ventas = await this.ventaRepo.find({
      where: { caja_id: id },
      relations: ['detalles'],
      order: { created_at: 'ASC' },
    });

    const completadas = ventas.filter(v => v.estado === VentaEstado.COMPLETADA);
    const canceladas = ventas.filter(v => v.estado === VentaEstado.CANCELADA);

    const totalVentas = completadas.reduce((s, v) => s + Number(v.total), 0);
    // Efectivo real = lo que se entregó - cambio devuelto
    const totalEfectivo = completadas.filter(v => v.pago_efectivo).reduce((s, v) => s + Number(v.pago_efectivo) - Number(v.cambio || 0), 0);
    const totalTarjeta = completadas.filter(v => v.pago_tarjeta).reduce((s, v) => s + Number(v.pago_tarjeta), 0);
    const totalTransferencia = completadas.filter(v => v.pago_transferencia).reduce((s, v) => s + Number(v.pago_transferencia), 0);

    // Top productos
    const prodMap = new Map<string, { nombre: string; cantidad: number; total: number }>();
    completadas.forEach(v => v.detalles?.forEach(d => {
      const curr = prodMap.get(d.producto_sku) || { nombre: d.producto_nombre, cantidad: 0, total: 0 };
      curr.cantidad += Number(d.cantidad);
      curr.total += Number(d.subtotal);
      prodMap.set(d.producto_sku, curr);
    }));

    return {
      caja,
      ventas,
      resumen: {
        num_ventas: completadas.length,
        num_canceladas: canceladas.length,
        total_ventas: totalVentas,
        total_efectivo: totalEfectivo,
        total_tarjeta: totalTarjeta,
        total_transferencia: totalTransferencia,
        total_entradas: Number(caja.total_entradas || 0),
        total_salidas: Number(caja.total_salidas || 0),
        fondo_apertura: Number(caja.fondo_apertura || 0),
        esperado_en_caja: Number(caja.fondo_apertura || 0) + totalEfectivo + Number(caja.total_entradas || 0) - Number(caja.total_salidas || 0),
        total_real: Number(caja.total_real || 0),
        diferencia: Number(caja.diferencia || 0),
      },
      top_productos: [...prodMap.values()].sort((a, b) => b.total - a.total).slice(0, 20),
    };
  }

  getActiva(scope: any) {
    return this.cajaRepo.findOne({
      where: { tienda_id: scope.tienda_id, estado: CajaEstado.ABIERTA },
    });
  }

  findAll(scope: any) {
    return this.cajaRepo.find({
      where: { tienda_id: scope.tienda_id },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }
}
