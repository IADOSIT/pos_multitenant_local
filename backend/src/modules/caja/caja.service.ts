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

    caja.total_real = data.total_real || 0;
    caja.total_esperado = Number(caja.fondo_apertura) + Number(caja.total_ventas) + Number(caja.total_entradas) - Number(caja.total_salidas);
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
    const totalEfectivo = ventas.filter(v => v.pago_efectivo).reduce((sum, v) => sum + Number(v.pago_efectivo), 0);
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
