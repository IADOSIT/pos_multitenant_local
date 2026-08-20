import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { EmpresasService } from './empresas.service';

@Controller('empresas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('superadmin', 'admin')
export class EmpresasController {
  constructor(private service: EmpresasService) {}

  @Get()
  findAll(@TenantScope() scope) { return this.service.findAll(scope); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() data: any) { return this.service.create(data); }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.update(id, data); }

  @Post(':id/upload-logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    const { saveUploadedImage } = await import('../../common/utils/upload-image.util');
    const logoUrl = await saveUploadedImage(file, `logo-empresa-${id}`);
    await this.service.update(id, { logo_url: logoUrl });
    return { logo_url: logoUrl };
  }

  @Delete(':id')
  @Roles('superadmin')
  delete(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Patch(':id/config-especial')
  @Roles('superadmin', 'admin')
  setConfigEspecial(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: {
      mostrar_precios?: boolean;
      precio_manual?: boolean;
      notif_cliente_estados?: boolean;
      empleados_enabled?: boolean;
      campos_formulario?: any;
      inventario_compartido?: boolean;
      transferencias_activo?: boolean;
      moneda?: {
        activa?: boolean;
        codigo?: string;
        modo_tipo_cambio?: 'manual' | 'automatico';
        tipo_cambio_manual?: number;
        tipo_cambio_actual?: number;
        modo_visualizacion?: 'ambas' | 'solo_base' | 'solo_secundaria';
      };
    },
    @TenantScope() scope,
  ) {
    return this.service.setConfigEspecial(id, data, scope);
  }
}
