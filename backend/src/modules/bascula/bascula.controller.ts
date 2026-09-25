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

  // ── Cajon de dinero (respaldo por la nube; el camino normal es el puente local) ──
  @Post('cajon/:tienda_id/abrir')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  abrirCajon(@Param('tienda_id', ParseIntPipe) tiendaId: number, @Request() req: any) {
    return this.service.abrirCajon(tiendaId, req.user);
  }

  // La descarga del instalador vive en GET /api/bridge/descargar/:token
  // (bridge-descarga.controller.ts), sin JWT: se baja desde la computadora de la caja,
  // donde casi nunca hay una sesion de administrador abierta.
  @Get('bridge/disponible')
  @Roles('superadmin', 'admin')
  bridgeDisponible() {
    return { disponible: !!this.service.rutaInstalador() };
  }

  @Post('pesaje')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  registrarPesaje(@Body() dto: { tienda_id: number; producto_id: number; peso_kg: number }, @Request() req: any) {
    return this.service.registrarPesaje(dto, req.user);
  }
}
