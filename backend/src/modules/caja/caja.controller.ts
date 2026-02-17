import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { CajaService } from './caja.service';

@Controller('caja')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CajaController {
  constructor(private service: CajaService) {}

  @Post('abrir')
  abrir(@Body() data: any, @TenantScope() scope) {
    return this.service.abrir(data, scope);
  }

  @Post(':id/cerrar')
  @Roles('superadmin', 'admin', 'manager', 'cajero')
  cerrar(@Param('id', ParseIntPipe) id: number, @Body() data: any, @TenantScope() scope) {
    return this.service.cerrar(id, data, scope);
  }

  @Post(':id/movimiento')
  movimiento(@Param('id', ParseIntPipe) id: number, @Body() data: any, @TenantScope() scope) {
    return this.service.movimiento(id, data, scope);
  }

  @Get(':id/corte-x')
  corteX(@Param('id', ParseIntPipe) id: number) {
    return this.service.corteX(id);
  }

  @Get('activa')
  getActiva(@TenantScope() scope) {
    return this.service.getActiva(scope);
  }

  @Get()
  findAll(@TenantScope() scope) {
    return this.service.findAll(scope);
  }
}
