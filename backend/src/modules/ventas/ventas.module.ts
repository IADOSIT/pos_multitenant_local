import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta, VentaDetalle, VentaPago } from './venta.entity';
import { Auditoria } from './auditoria.entity';
import { Caja } from '../caja/caja.entity';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, VentaDetalle, VentaPago, Auditoria, Caja])],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
