import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { RepartidoresControlService } from './repartidores-control.service';

/**
 * Control y Liquidacion de Repartidores (opcional por tienda).
 * Todo responde 403 si el superadmin no lo habilito para la tienda en contexto.
 */
@Controller('repartidores-control')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RepartidoresControlController {
  constructor(private service: RepartidoresControlService) {}

  // Lo consulta el menu y el POS para saber si mostrar el modulo. Nunca da 403.
  @Get('estado')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  estado(@TenantScope() scope) {
    return this.service.estado(scope);
  }

  // ── Catalogo ─────────────────────────────────────────────────────────
  @Get('repartidores')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  listar(@TenantScope() scope) {
    return this.service.listarRepartidores(scope);
  }

  @Post('repartidores')
  @Roles('superadmin', 'admin', 'manager')
  crear(@Body() data: any, @TenantScope() scope) {
    return this.service.crearRepartidor(data, scope);
  }

  @Put('repartidores/:id')
  @Roles('superadmin', 'admin', 'manager')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() data: any, @TenantScope() scope) {
    return this.service.actualizarRepartidor(id, data, scope);
  }

  @Post('repartidores/:id/regenerar-codigo')
  @Roles('superadmin', 'admin', 'manager')
  regenerar(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.regenerarCodigo(id, scope);
  }

  // ── Asignacion (despues de cobrar) ───────────────────────────────────
  @Post('asignar')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  asignar(@Body() data: any, @TenantScope() scope) {
    return this.service.asignar(data, scope);
  }

  @Post('asignaciones/:id/reasignar')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  reasignar(@Param('id', ParseIntPipe) id: number, @Body() data: any, @TenantScope() scope) {
    return this.service.reasignar(id, data, scope);
  }

  @Post('asignaciones/:id/quitar')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  quitar(@Param('id', ParseIntPipe) id: number, @Body() data: any, @TenantScope() scope) {
    return this.service.quitar(id, data, scope);
  }

  // ── Tablero, detalle y liquidacion ───────────────────────────────────
  @Get('tablero')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  tablero(@TenantScope() scope) {
    return this.service.tablero(scope);
  }

  @Get('repartidores/:id/pendientes')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  pendientes(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.pendientesDe(id, scope);
  }

  @Post('liquidar')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  liquidar(@Body() data: any, @TenantScope() scope) {
    return this.service.liquidar(data, scope);
  }

  @Get('liquidaciones')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  liquidaciones(@Query() q: any, @TenantScope() scope) {
    return this.service.liquidaciones(q, scope);
  }

  @Get('liquidaciones/:id')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  liquidacion(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.liquidacion(id, scope);
  }

  @Get('historial')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  historial(@Query() q: any, @TenantScope() scope) {
    return this.service.historial(q, scope);
  }
}
