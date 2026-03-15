import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { MesasService } from './mesas.service';

@Controller('mesas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MesasController {
  constructor(private service: MesasService) {}

  @Get()
  findAll(@TenantScope() scope) {
    return this.service.findAll(scope);
  }

  @Post()
  @Roles('superadmin', 'admin')
  create(@Body() data: any, @TenantScope() scope) {
    return this.service.create(data, scope);
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get('asignaciones')
  @Roles('superadmin', 'admin')
  getAsignaciones(@TenantScope() scope) {
    return this.service.getAsignaciones(scope.tienda_id, scope.tenant_id, scope.empresa_id);
  }

  @Post(':id/asignar')
  @Roles('superadmin', 'admin')
  asignarMesero(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { user_id: number; user_nombre: string },
    @TenantScope() scope,
  ) {
    return this.service.asignarMesero(id, body.user_id, body.user_nombre, scope);
  }

  @Delete(':id/asignar')
  @Roles('superadmin', 'admin')
  desasignarMesero(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.desasignarMesero(id, scope);
  }

  @Get('juntas')
  getMesasJuntas(@TenantScope() scope) {
    return this.service.getMesasJuntas(scope.tienda_id);
  }

  @Post('juntar')
  @Roles('superadmin', 'admin')
  juntarMesas(@Body() body: { mesa_principal_id: number; mesa_secundaria_id: number }, @TenantScope() scope) {
    return this.service.juntarMesas(body.mesa_principal_id, body.mesa_secundaria_id, scope);
  }

  @Post('separar')
  @Roles('superadmin', 'admin')
  separarMesas(@Body() body: { mesa_principal_id: number; mesa_secundaria_id: number }, @TenantScope() scope) {
    return this.service.separarMesas(body.mesa_principal_id, body.mesa_secundaria_id, scope.tienda_id);
  }
}
