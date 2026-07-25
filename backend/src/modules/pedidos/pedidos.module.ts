import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido, PedidoDetalle } from './pedido.entity';
import { VentasModule } from '../ventas/ventas.module';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { SelfOrderModule } from '../self-order/self-order.module';
import { LogisticaModule } from '../logistica/logistica.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, PedidoDetalle]),
    VentasModule,
    forwardRef(() => SelfOrderModule),
    LogisticaModule,
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
