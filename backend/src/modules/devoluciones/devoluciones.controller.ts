import { Controller, Get, Post, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DevolucionesService } from './devoluciones.service';

@Controller('devoluciones')
@UseGuards(JwtAuthGuard)
export class DevolucionesController {
  constructor(private readonly service: DevolucionesService) {}

  // Verificar permiso según config_pos.devoluciones_rol
  private checkPermiso(scope: any) {
    const cp = scope.config_pos || {};
    const rol = cp.devoluciones_rol || 'admin';
    const userRol = scope.rol;
    if (rol === 'cajero') return; // todos pueden
    if (['admin', 'superadmin', 'manager'].includes(userRol)) return;
    throw new ForbiddenException('No tienes permiso para realizar devoluciones');
  }

  @Get()
  findAll(@Request() req: any, @Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.service.findAll(req.user, desde, hasta);
  }

  @Get('venta/:ventaId')
  findByVenta(@Param('ventaId') ventaId: string, @Request() req: any) {
    return this.service.findByVenta(Number(ventaId), req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(Number(id), req.user);
  }

  @Post()
  crear(@Body() body: any, @Request() req: any) {
    this.checkPermiso(req.user);
    return this.service.crear(body, req.user);
  }
}
