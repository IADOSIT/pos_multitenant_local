import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repartidor } from '../logistica/repartidor.entity';
import { RepartidorQr } from './repartidor-qr.entity';
import { RepartidorAsignacion } from './repartidor-asignacion.entity';
import { RepartidorLiquidacion } from './repartidor-liquidacion.entity';
import { RepartidoresControlService } from './repartidores-control.service';
import { RepartidoresControlController } from './repartidores-control.controller';

/**
 * Control y Liquidacion de Repartidores. Solo agrega tablas nuevas
 * (repartidor_qr, repartidor_asignaciones, repartidor_liquidaciones); lee
 * `repartidores`, `ventas`, `venta_detalles`, `cajas` y `tiendas` sin alterarlas.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Repartidor, RepartidorQr, RepartidorAsignacion, RepartidorLiquidacion]),
  ],
  controllers: [RepartidoresControlController],
  providers: [RepartidoresControlService],
})
export class RepartidoresControlModule {}
