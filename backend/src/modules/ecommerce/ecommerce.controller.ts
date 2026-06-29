import { Controller, Get, Put, Post, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { EcommerceService } from './ecommerce.service';

@Controller('ecommerce')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EcommerceController {
  constructor(
    private service: EcommerceService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // ─── CONFIG ────────────────────────────────────────────────────────────────

  @Get('config')
  getConfig(@TenantScope() scope) {
    return this.service.getConfig(scope);
  }

  @Put('config')
  @Roles('superadmin', 'admin')
  upsertConfig(@TenantScope() scope, @Body() body: any) {
    return this.service.upsertConfig(scope, body);
  }

  @Get('config/verificar-subdominio')
  verificarSubdominio(@TenantScope() scope, @Query('subdominio') sub: string) {
    return this.service.verificarSubdominio(sub, scope.empresa_id);
  }

  @Post('config/generar-subdominio')
  @Roles('superadmin', 'admin')
  generarSubdominio(@Body('nombre') nombre: string) {
    return this.service.generarSubdominioUnico(nombre);
  }

  @Get('config/temas')
  getTemas() {
    return this.service.getTemas();
  }

  // ─── PRODUCTOS ECOMMERCE ───────────────────────────────────────────────────

  @Get('productos')
  getProductosEcommerce(@TenantScope() scope, @Query() query: any) {
    return this.service.getPublicProductos('', this.dataSource, { ...query, _scope: scope });
  }

  @Get('productos/:id/config')
  getProductoConfig(@Param('id', ParseIntPipe) id: number) {
    return this.service.getProductoConfig(id);
  }

  @Put('productos/:id/config')
  @Roles('superadmin', 'admin')
  upsertProductoConfig(@TenantScope() scope, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.upsertProductoConfig(scope, id, body);
  }

  @Post('productos/bulk-visibilidad')
  @Roles('superadmin', 'admin')
  bulkVisibilidad(@TenantScope() scope, @Body() body: { ids: number[]; visible: boolean }) {
    return this.service.bulkVisibilidad(scope, body.ids, body.visible);
  }

  // ─── PEDIDOS WEB ──────────────────────────────────────────────────────────

  @Get('pedidos')
  listPedidos(@TenantScope() scope, @Query() query: any) {
    return this.service.listPedidos(scope, query);
  }

  @Get('pedidos/:id')
  getPedido(@TenantScope() scope, @Param('id', ParseIntPipe) id: number) {
    return this.service.getPedido(scope, id);
  }

  @Put('pedidos/:id/estado')
  @Roles('superadmin', 'admin', 'manager')
  updateEstado(@TenantScope() scope, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateEstadoPedido(scope, id, body.estado, body.notas_internas);
  }

  @Delete('pedidos/:id')
  @Roles('superadmin', 'admin')
  deletePedido(@TenantScope() scope, @Param('id', ParseIntPipe) id: number) {
    return this.service.deletePedido(scope, id);
  }
}
