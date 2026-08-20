import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApartadoInventario } from './apartado.entity';
import { ApartadosController } from './apartados.controller';
import { ApartadosService } from './apartados.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApartadoInventario])],
  controllers: [ApartadosController],
  providers: [ApartadosService],
  exports: [ApartadosService],
})
export class ApartadosModule {}
