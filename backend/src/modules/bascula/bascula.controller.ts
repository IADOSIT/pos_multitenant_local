import { Controller, Get, Put, Post, Param, Body, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BasculaService } from './bascula.service';

@Controller('bascula')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BasculaController {
  constructor(private readonly service: BasculaService) {}

  @Get('config/:tienda_id')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  getConfig(@Param('tienda_id', ParseIntPipe) tiendaId: number, @Request() req: any) {
    return this.service.getOrCreateConfig(tiendaId, req.user);
  }

  @Put('config/:tienda_id')
  @Roles('superadmin', 'admin')
  updateConfig(@Param('tienda_id', ParseIntPipe) tiendaId: number, @Body() dto: any, @Request() req: any) {
    return this.service.updateConfig(tiendaId, dto, req.user);
  }

  @Post('config/:tienda_id/regenerate-token')
  @Roles('superadmin', 'admin')
  regenerateToken(@Param('tienda_id', ParseIntPipe) tiendaId: number, @Request() req: any) {
    return this.service.regenerateToken(tiendaId, req.user);
  }

  @Get('productos/:tienda_id')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  getProductos(@Param('tienda_id', ParseIntPipe) tiendaId: number, @Request() req: any) {
    return this.service.getProductosPorPeso(tiendaId, req.user);
  }

  @Post('pesaje')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  registrarPesaje(@Body() dto: { tienda_id: number; producto_id: number; peso_kg: number }, @Request() req: any) {
    return this.service.registrarPesaje(dto, req.user);
  }
}
