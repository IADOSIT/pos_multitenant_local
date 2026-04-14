import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { PerfilesService } from './perfiles.service';

@Controller('perfiles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PerfilesController {
  constructor(private readonly service: PerfilesService) {}

  @Get('activo')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  getActivo(@TenantScope() scope) {
    return this.service.getPerfilActivo(scope.tenant_id);
  }

  @Post('activar')
  @Roles('superadmin', 'admin')
  activar(@Body() body: { perfil_clave: string }, @TenantScope() scope) {
    return this.service.activarPerfil(
      scope.tenant_id,
      scope.empresa_id,
      scope.tienda_id,
      body.perfil_clave,
      scope,
    );
  }

  @Delete('desactivar/:clave')
  @Roles('superadmin', 'admin')
  desactivar(@Param('clave') clave: string, @TenantScope() scope) {
    return this.service.desactivarPerfil(scope.tenant_id, clave);
  }

  @Get('alertas-stock')
  @Roles('superadmin', 'admin', 'manager', 'cajero', 'mesero')
  alertasStock(@TenantScope() scope, @Query('modulo') modulo?: string) {
    return this.service.getAlertasStock(scope.tenant_id, scope.empresa_id, modulo);
  }

  @Get('resumen/:modulo')
  @Roles('superadmin', 'admin', 'manager')
  resumenModulo(@Param('modulo') modulo: string, @TenantScope() scope) {
    return this.service.getResumenModulo(scope.tenant_id, scope.empresa_id, modulo);
  }
}
