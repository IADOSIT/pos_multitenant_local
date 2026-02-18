import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { LicenciasService } from './licencias.service';

@Controller('licencias')
export class LicenciasController {
  constructor(private service: LicenciasService) {}

  // ---- Client endpoints ----

  @Get('estado')
  @UseGuards(AuthGuard('jwt'))
  getEstado(@TenantScope() scope) {
    return this.service.getEstado(scope.tenant_id);
  }

  @Post('activar')
  @UseGuards(AuthGuard('jwt'))
  activar(@TenantScope() scope, @Body() body: { codigo: string }) {
    return this.service.activar(scope.tenant_id, body.codigo);
  }

  @Post('heartbeat')
  @UseGuards(AuthGuard('jwt'))
  heartbeat(@TenantScope() scope) {
    return this.service.heartbeat(scope.tenant_id);
  }

  // ---- Superadmin endpoints ----

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post('generar-codigo')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  generarCodigo(@Body() body: {
    tenant_id: number;
    plan: string;
    meses: number;
    max_tiendas?: number;
    max_usuarios?: number;
    features?: string[];
    grace_days?: number;
    offline_allowed?: boolean;
  }) {
    const raw = this.service.generarCodigoActivacion(body);
    return {
      codigo_raw: raw,
      codigo_formateado: this.service.formatCode(raw),
    };
  }

  @Post(':id/suspender')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  suspender(@Param('id', ParseIntPipe) id: number) {
    return this.service.suspender(id);
  }

  @Post(':id/reactivar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  reactivar(@Param('id', ParseIntPipe) id: number) {
    return this.service.reactivar(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
