import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeployService } from './deploy.service';

@Controller('deploy')
export class DeployController {
  constructor(private svc: DeployService) {}

  // Público: cualquier cliente (incluido el frontend en la pantalla de login) puede leer
  // la versión desplegada y si hay una actualización en progreso.
  @Get('version')
  version() {
    return this.svc.get();
  }

  // Superadmin: marcar una actualización EN PROGRESO (antes de un redeploy).
  @Post('en-progreso')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  enProgreso(@Body() body: { mensaje?: string; version?: string }) {
    return this.svc.setEstado('en_progreso', { mensaje: body?.mensaje, version: body?.version });
  }

  // Superadmin: marcar una actualización COMPLETADA (por si sólo se redeployó el frontend
  // y el backend no reinició para auto-marcarla).
  @Post('completada')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  completada(@Body() body: { mensaje?: string; version?: string }) {
    return this.svc.setEstado('completada', { mensaje: body?.mensaje, version: body?.version });
  }
}
