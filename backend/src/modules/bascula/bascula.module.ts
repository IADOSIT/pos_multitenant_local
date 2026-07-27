import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigBascula } from './config-bascula.entity';
import { PesajeLog } from './pesaje-log.entity';
import { BasculaService } from './bascula.service';
import { BasculaGateway } from './bascula.gateway';
import { BasculaController } from './bascula.controller';
import { VentasModule } from '../ventas/ventas.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigBascula, PesajeLog]), VentasModule],
  controllers: [BasculaController],
  providers: [BasculaService, BasculaGateway],
  exports: [BasculaService],
})
export class BasculaModule {}
