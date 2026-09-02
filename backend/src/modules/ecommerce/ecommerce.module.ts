import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EcommerceConfig } from './ecommerce-config.entity';
import { EcommercePedido } from './ecommerce-pedido.entity';
import { EcommerceProductoConfig } from './ecommerce-producto-config.entity';
import { Cliente } from './cliente.entity';
import { EcommerceService } from './ecommerce.service';
import { EcommerceController } from './ecommerce.controller';
import { EcommercePublicController } from './ecommerce-public.controller';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EcommerceConfig, EcommercePedido, EcommerceProductoConfig, Cliente]),
    // Al cotizar se crea el pedido de mostrador que se cobra en el POS.
    PedidosModule,
  ],
  controllers: [EcommerceController, EcommercePublicController],
  providers: [EcommerceService],
  exports: [EcommerceService],
})
export class EcommerceModule {}
