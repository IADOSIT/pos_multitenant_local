import { Controller, Get, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { LogisticaService } from './logistica.service';
import { EstadoEntrega } from './entrega-pedido.entity';

@Controller('public/logistica')
export class LogisticaPublicController {
  constructor(private service: LogisticaService) {}

  @Get(':token')
  getRepartidorView(@Param('token') token: string) {
    return this.service.getRepartidorByToken(token);
  }

  @Patch(':token/entrega/:entrega_id')
  updateEstadoByToken(
    @Param('token') token: string,
    @Param('entrega_id', ParseIntPipe) entrega_id: number,
    @Body() body: { estado: EstadoEntrega; notas?: string },
  ) {
    return this.service.updateEstadoByToken(token, entrega_id, body.estado, body.notas);
  }
}
