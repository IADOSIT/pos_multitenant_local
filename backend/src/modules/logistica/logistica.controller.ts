import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { LogisticaService } from './logistica.service';
import { EstadoEntrega } from './entrega-pedido.entity';

@Controller('logistica')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LogisticaController {
  constructor(private service: LogisticaService) {}

  // ── Repartidores ──────────────────────────────────────────────────────
  @Get('repartidores')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  getRepartidores(@TenantScope() scope) {
    return this.service.getRepartidores(scope);
  }

  @Post('repartidores')
  @Roles('superadmin', 'admin')
  createRepartidor(@Body() data: any, @TenantScope() scope) {
    return this.service.createRepartidor(data, scope);
  }

  @Put('repartidores/:id')
  @Roles('superadmin', 'admin')
  updateRepartidor(@Param('id', ParseIntPipe) id: number, @Body() data: any, @TenantScope() scope) {
    return this.service.updateRepartidor(id, data, scope);
  }

  @Patch('repartidores/:id/toggle')
  @Roles('superadmin', 'admin')
  toggleRepartidor(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.toggleRepartidor(id, scope);
  }

  // ── Asignación y entregas ─────────────────────────────────────────────
  @Post('asignar')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  asignar(@Body() body: { pedido_id: number; repartidor_id: number }, @TenantScope() scope) {
    return this.service.asignarRepartidor(body.pedido_id, body.repartidor_id, scope);
  }

  @Get('entregas')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  getEntregas(@TenantScope() scope, @Query() params: any) {
    return this.service.getEntregas(scope, params);
  }

  @Get('entregas/pedido/:pedido_id')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  getEntregaByPedido(@Param('pedido_id', ParseIntPipe) pedido_id: number, @TenantScope() scope) {
    return this.service.getEntregaByPedido(pedido_id, scope);
  }

  @Patch('entregas/:id/estado')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: EstadoEntrega; notas?: string },
    @TenantScope() scope,
  ) {
    return this.service.updateEstadoEntrega(id, body.estado, body.notas, scope);
  }

  // ── Config y métricas ─────────────────────────────────────────────────
  @Get('config')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  getConfig(@TenantScope() scope) {
    return this.service.getConfig(scope);
  }

  @Put('config')
  @Roles('superadmin', 'admin')
  upsertConfig(@Body() data: any, @TenantScope() scope) {
    return this.service.upsertConfig(data, scope);
  }

  @Get('metricas')
  @Roles('superadmin', 'admin', 'manager')
  getMetricas(@TenantScope() scope, @Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.service.getMetricas(scope, desde, hasta);
  }

  @Get('notif-log')
  @Roles('superadmin', 'admin')
  getLogNotif(@TenantScope() scope, @Query('pedido_id') pedido_id?: string) {
    return this.service.getLogNotif(scope, pedido_id ? parseInt(pedido_id) : undefined);
  }
}
