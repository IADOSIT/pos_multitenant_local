import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { TransferenciasService } from './transferencias.service';

@Controller('transferencias')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TransferenciasController {
  constructor(private service: TransferenciasService) {}

  @Post()
  crear(@Body() data: { tienda_destino_id: number; producto_id: number; cantidad: number; notas?: string }, @TenantScope() scope) {
    if (!data?.tienda_destino_id || !data?.producto_id || !data?.cantidad) {
      throw new BadRequestException('Faltan datos de la transferencia');
    }
    return this.service.crear(data, scope);
  }

  @Get('pendientes-recibir')
  listPendientesRecibir(@TenantScope() scope) {
    return this.service.listPendientesRecibir(scope);
  }

  @Get('enviadas')
  listEnviadas(@TenantScope() scope) {
    return this.service.listEnviadas(scope);
  }

  @Get('folio/:folio')
  buscarPorFolio(@Param('folio') folio: string, @TenantScope() scope) {
    return this.service.buscarPorFolio(folio, scope);
  }

  @Post(':id/recibir')
  recibir(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.recibir(id, scope);
  }

  @Post(':id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number, @Body() body: { motivo?: string }, @TenantScope() scope) {
    if (!body?.motivo) throw new BadRequestException('Indica el motivo de la cancelacion');
    return this.service.cancelar(id, body.motivo, scope);
  }
}
