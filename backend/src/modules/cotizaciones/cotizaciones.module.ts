import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cotizacion } from './cotizacion.entity';
import { CotizacionVersion } from './cotizacion-version.entity';
import { EcommerceConfig } from '../ecommerce/ecommerce-config.entity';
import { PedidosModule } from '../pedidos/pedidos.module';
import { CotizacionesController } from './cotizaciones.controller';
import { CotizacionesInternalController } from './cotizaciones-internal.controller';
import { CotizacionesService } from './cotizaciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cotizacion, CotizacionVersion, EcommerceConfig]),
    // Al aceptar el cliente se materializa el pedido de mostrador.
    PedidosModule,
  ],
  controllers: [CotizacionesController, CotizacionesInternalController],
  providers: [CotizacionesService],
  exports: [CotizacionesService],
})
export class CotizacionesModule {}
