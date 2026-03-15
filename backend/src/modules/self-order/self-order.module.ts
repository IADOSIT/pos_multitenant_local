import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from '../pedidos/pedido.entity';
import { Mesa } from '../mesas/mesa.entity';
import { SelfOrderService } from './self-order.service';
import { SelfOrderController, SelfOrderPublicController } from './self-order.controller';
import { MesasModule } from '../mesas/mesas.module';
import { EncuestasModule } from '../encuestas/encuestas.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Mesa]),
    MesasModule,
    EncuestasModule,
    NotificacionesModule,
  ],
  controllers: [SelfOrderPublicController, SelfOrderController],
  providers: [SelfOrderService],
  exports: [SelfOrderService],
})
export class SelfOrderModule {}
