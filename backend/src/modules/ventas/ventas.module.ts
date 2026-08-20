import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta, VentaDetalle, VentaPago } from './venta.entity';
import { Auditoria } from './auditoria.entity';
import { Caja } from '../caja/caja.entity';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { EmpresasModule } from '../empresas/empresas.module';
import { ApartadosModule } from '../apartados/apartados.module';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, VentaDetalle, VentaPago, Auditoria, Caja]), EmpresasModule, ApartadosModule],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
