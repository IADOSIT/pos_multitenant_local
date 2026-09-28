import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigBascula } from './config-bascula.entity';
import { PesajeLog } from './pesaje-log.entity';
import { BasculaService } from './bascula.service';
import { BasculaGateway } from './bascula.gateway';
import { BasculaController } from './bascula.controller';
import { BridgeDescargaController } from './bridge-descarga.controller';
// AuthModule se importa solo por el JwtService que ya exporta (mismo motivo que
// monitor.module): el gateway verifica el JWT del navegador que quiere escuchar.
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigBascula, PesajeLog]), AuthModule],
  controllers: [BasculaController, BridgeDescargaController],
  providers: [BasculaService, BasculaGateway],
  exports: [BasculaService],
})
export class BasculaModule {}
