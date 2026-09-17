import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { CotizacionesService, CotizarDto } from './cotizaciones.service';

@Controller('cotizaciones')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CotizacionesController {
  constructor(private readonly service: CotizacionesService) {}

  @Get()
  listar(@TenantScope() scope: any, @Query() query: any) {
    return this.service.listar(scope, {
      estado: query.estado,
      q: query.q,
      desde: query.desde,
      hasta: query.hasta,
    });
  }

  @Get(':id')
  detalle(@TenantScope() scope: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.detalle(scope, id);
  }

  @Post(':id/cotizar')
  @Roles('superadmin', 'admin', 'manager')
  cotizar(@TenantScope() scope: any, @Param('id', ParseIntPipe) id: number, @Body() dto: CotizarDto) {
    return this.service.cotizar(scope, id, dto);
  }

  @Post(':id/cerrar')
  @Roles('superadmin', 'admin', 'manager')
  cerrar(@TenantScope() scope: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.cerrar(scope, id, body?.motivo);
  }

  @Patch(':id/notas')
  @Roles('superadmin', 'admin', 'manager')
  notas(@TenantScope() scope: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.actualizarNotas(scope, id, body?.notas_internas);
  }
}
