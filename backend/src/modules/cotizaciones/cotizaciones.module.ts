import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cotizacion } from './cotizacion.entity';
import { CotizacionVersion } from './cotizacion-version.entity';
import { EcommerceConfig } from '../ecommerce/ecommerce-config.entity';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cotizacion, CotizacionVersion, EcommerceConfig]),
    // Al aceptar el cliente se materializa el pedido de mostrador.
    PedidosModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class CotizacionesModule {}
