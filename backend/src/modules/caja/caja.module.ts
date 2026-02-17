import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caja, MovimientoCaja } from './caja.entity';
import { Venta } from '../ventas/venta.entity';
import { Auditoria } from '../ventas/auditoria.entity';
import { CajaController } from './caja.controller';
import { CajaService } from './caja.service';

@Module({
  imports: [TypeOrmModule.forFeature([Caja, MovimientoCaja, Venta, Auditoria])],
  controllers: [CajaController],
  providers: [CajaService],
  exports: [CajaService],
})
export class CajaModule {}
