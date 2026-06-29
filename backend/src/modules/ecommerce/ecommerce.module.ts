import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EcommerceConfig } from './ecommerce-config.entity';
import { EcommercePedido } from './ecommerce-pedido.entity';
import { EcommerceProductoConfig } from './ecommerce-producto-config.entity';
import { EcommerceService } from './ecommerce.service';
import { EcommerceController } from './ecommerce.controller';
import { EcommercePublicController } from './ecommerce-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EcommerceConfig, EcommercePedido, EcommerceProductoConfig])],
  controllers: [EcommerceController, EcommercePublicController],
  providers: [EcommerceService],
  exports: [EcommerceService],
})
export class EcommerceModule {}
