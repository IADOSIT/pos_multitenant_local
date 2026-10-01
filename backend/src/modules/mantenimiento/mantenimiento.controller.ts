import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MantenimientoService } from './mantenimiento.service';

/**
 * Mantenimiento de una instalacion en sitio (on-premise).
 *
 * Todo esto solo tiene sentido cuando el POS corre en la computadora del
 * cliente: ahi hay un disco que respaldar y un servicio de Windows que
 * reiniciar. En la nube el servicio contesta `on_premise: false` en `estado`
 * y 404 en todo lo demas, asi que la pantalla simplemente no se muestra y
 * ningun cliente en linea se ve afectado.
 */
@Controller('mantenimiento')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('superadmin', 'admin')
export class MantenimientoController {
  constructor(private svc: MantenimientoService) {}

  /** Version, tamanos, respaldos y que herramientas hay. Nunca falla. */
  @Get('estado')
  estado() {
    return this.svc.estado();
  }

  @Get('respaldos')
  respaldos() {
    return { respaldos: this.svc.listarRespaldos() };
  }

  /** Avance de una tarea lanzada, con la cola de su bitacora. */
  @Get('trabajo/:id')
  trabajo(@Param('id') id: string) {
    return this.svc.trabajo(id);
  }

  @Post('respaldar')
  respaldar(@Body() body: { etiqueta?: string; sin_excel?: boolean; sin_imagenes?: boolean }) {
    return this.svc.respaldar(body?.etiqueta || 'manual', {
      sinExcel: !!body?.sin_excel,
      sinImagenes: !!body?.sin_imagenes,
    });
  }

  @Post('excel')
  excel() {
    return this.svc.exportarExcel();
  }

  /** Sin `arreglar` solo reporta. Con `arreglar` ajusta rutas; no borra URLs. */
  @Post('imagenes')
  imagenes(@Body() body: { arreglar?: boolean }) {
    return this.svc.imagenes(!!body?.arreglar);
  }

  @Post('ajustes')
  ajustes() {
    return this.svc.ajustes();
  }

  /** Regresa a un respaldo. El script respalda el estado de hoy antes. */
  @Post('revertir')
  revertir(@Body() body: { respaldo: string }) {
    return this.svc.revertir(body?.respaldo);
  }

  @Get('actualizacion')
  buscarActualizacion() {
    return this.svc.buscarActualizacion();
  }

  @Post('actualizar')
  actualizar(@Body() body: { paquete?: string }) {
    return this.svc.actualizar(body || {});
  }
}
