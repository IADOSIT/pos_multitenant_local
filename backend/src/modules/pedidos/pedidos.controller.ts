import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { PedidosService } from './pedidos.service';

@Controller('pedidos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PedidosController {
  constructor(private service: PedidosService) {}

  @Post()
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  crear(@Body() data: any, @TenantScope() scope) {
    return this.service.crear(data, scope);
  }

  @Get()
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  findAll(@TenantScope() scope, @Query('estado') estado?: string) {
    return this.service.findAll(scope, estado);
  }

  @Get('pendientes')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  findPendientes(@TenantScope() scope) {
    return this.service.findPendientes(scope);
  }

  @Get('count')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  countPendientes(@TenantScope() scope) {
    return this.service.countPendientes(scope);
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/estado')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  updateEstado(@Param('id', ParseIntPipe) id: number, @Body('estado') estado: any, @TenantScope() scope) {
    return this.service.updateEstado(id, estado, scope);
  }

  @Post(':id/cobrar')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  cobrar(@Param('id', ParseIntPipe) id: number, @Body() pagoData: any, @TenantScope() scope) {
    return this.service.cobrar(id, pagoData, scope);
  }

  @Post(':id/cancelar')
  @Roles('superadmin', 'admin', 'manager')
  cancelar(@Param('id', ParseIntPipe) id: number, @Body('motivo') motivo: string, @TenantScope() scope) {
    return this.service.cancelar(id, motivo, scope);
  }
}
