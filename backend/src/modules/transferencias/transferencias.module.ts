import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferenciaInventario } from './transferencia.entity';
import { Producto } from '../productos/producto.entity';
import { TransferenciasController } from './transferencias.controller';
import { TransferenciasService } from './transferencias.service';
import { EmpresasModule } from '../empresas/empresas.module';

@Module({
  imports: [TypeOrmModule.forFeature([TransferenciaInventario, Producto]), EmpresasModule],
  controllers: [TransferenciasController],
  providers: [TransferenciasService],
  exports: [TransferenciasService],
})
export class TransferenciasModule {}
