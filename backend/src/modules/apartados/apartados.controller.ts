import { Controller, Get, Post, Param, Body, Query, UseGuards, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { ApartadosService } from './apartados.service';

@Controller('apartados')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ApartadosController {
  constructor(private service: ApartadosService) {}

  @Get('pendientes')
  listPendientes(@TenantScope() scope) {
    return this.service.listPendientes(scope);
  }

  @Get('folio/:folio')
  buscarPorFolio(@Param('folio') folio: string, @TenantScope() scope) {
    return this.service.buscarPorFolio(folio, scope);
  }

  @Post(':id/entregar')
  entregar(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.entregar(id, scope);
  }

  @Post(':id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number, @Body() body: { motivo?: string }, @TenantScope() scope) {
    if (!body?.motivo) throw new BadRequestException('Indica el motivo de la cancelacion');
    return this.service.cancelar(id, body.motivo, scope);
  }
}
