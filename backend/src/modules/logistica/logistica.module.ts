import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repartidor } from './repartidor.entity';
import { EntregaPedido } from './entrega-pedido.entity';
import { ConfigLogistica } from './config-logistica.entity';
import { LogNotifEntrega } from './log-notif-entrega.entity';
import { LogisticaService } from './logistica.service';
import { LogisticaController } from './logistica.controller';
import { LogisticaPublicController } from './logistica-public.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Repartidor,
      EntregaPedido,
      ConfigLogistica,
      LogNotifEntrega,
    ]),
  ],
  controllers: [LogisticaController, LogisticaPublicController],
  providers: [LogisticaService],
  exports: [LogisticaService],
})
export class LogisticaModule {}
