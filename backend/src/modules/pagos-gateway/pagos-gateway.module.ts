import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayConfig } from './gateway-config.entity';
import { GatewayTransaccion } from './gateway-transaccion.entity';
import { PagosGatewayController, PagosGatewayWebhookController } from './pagos-gateway.controller';
import { PagosGatewayService } from './pagos-gateway.service';

@Module({
  imports: [TypeOrmModule.forFeature([GatewayConfig, GatewayTransaccion])],
  controllers: [PagosGatewayController, PagosGatewayWebhookController],
  providers: [PagosGatewayService],
  exports: [PagosGatewayService],
})
export class PagosGatewayModule {}
