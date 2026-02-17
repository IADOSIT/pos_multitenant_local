import { Controller, Get, Post, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { VentasService } from './ventas.service';

@Controller('ventas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class VentasController {
  constructor(private service: VentasService) {}

  @Post()
  crear(@Body() data: any, @TenantScope() scope) {
    return this.service.crear(data, scope);
  }

  @Post('sync')
  syncOffline(@Body() data: { ventas: any[] }, @TenantScope() scope) {
    return this.service.syncOffline(data.ventas, scope);
  }

  @Post(':id/cancelar')
  @Roles('superadmin', 'admin', 'manager')
  cancelar(@Param('id', ParseIntPipe) id: number, @Body('motivo') motivo: string, @TenantScope() scope) {
    return this.service.cancelar(id, motivo, scope);
  }

  @Get()
  findAll(@TenantScope() scope, @Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.service.findAll(scope, desde, hasta);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
