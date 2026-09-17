import { Controller, Post, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { InternalSecretGuard } from '../../common/guards/internal-secret.guard';
import { CotizacionesService } from './cotizaciones.service';

// Lo llama POS_STORE_API por la red interna cuando el cliente acepta. No lleva
// JWT: el scope sale de la cotizacion.
@Controller('internal/cotizaciones')
@UseGuards(InternalSecretGuard)
export class CotizacionesInternalController {
  constructor(private readonly service: CotizacionesService) {}

  @Post(':id/pedido')
  materializar(@Param('id', ParseIntPipe) id: number) {
    return this.service.materializarPedido(id);
  }
}
