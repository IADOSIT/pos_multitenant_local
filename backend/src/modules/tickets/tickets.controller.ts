import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { TicketsService } from './tickets.service';
import { EmpresasService } from '../empresas/empresas.service';

@Controller('tickets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TicketsController {
  constructor(private service: TicketsService, private empresasService: EmpresasService) {}

  @Get('config')
  getConfig(@TenantScope() scope) {
    return this.service.getConfig(scope.tenant_id, scope.empresa_id, scope.tienda_id);
  }

  @Post('config')
  @Roles('superadmin', 'admin')
  saveConfig(@Body() data: any) {
    return this.service.saveConfig(data);
  }

  @Put('config/:id')
  @Roles('superadmin', 'admin')
  updateConfig(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.updateConfig(id, data);
  }

  @Post('upload-logo')
  @Roles('superadmin', 'admin')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const { saveUploadedImage } = await import('../../common/utils/upload-image.util');
    const logoUrl = await saveUploadedImage(file, 'logo-ticket');
    return { logo_url: logoUrl };
  }

  @Post('preview')
  async preview(@Body() data: any, @TenantScope() scope) {
    const config = await this.service.getConfig(scope.tenant_id, scope.empresa_id, scope.tienda_id);
    const { moneda } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    const ticket = this.service.generateTicketData(data.venta, config, moneda);
    return {
      ...ticket,
      ancho_papel:       config.ancho_papel    ?? 80,
      fuente_familia:    config.fuente_familia ?? 'Courier New',
      fuente_tamano:     config.fuente_tamano  ?? 9,
      logo_posicion:     config.logo_posicion  ?? 'centro',
      logo_url:          config.mostrar_logo ? config.logo_url : null,
      copias:            config.copias         ?? 1,
      impresion_enabled: config.impresion_enabled !== false,
      modo_impresion:    config.modo_impresion  ?? 'navegador',
    };
  }

  @Post('precuenta')
  async precuenta(@Body() data: any, @TenantScope() scope) {
    const config = await this.service.getConfig(scope.tenant_id, scope.empresa_id, scope.tienda_id);
    const { moneda } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    const ticket = this.service.generatePreCuentaData(data, config, moneda);
    return {
      ...ticket,
      ancho_papel:    config.ancho_papel    ?? 80,
      fuente_familia: config.fuente_familia ?? 'Courier New',
      fuente_tamano:  config.fuente_tamano  ?? 9,
      logo_posicion:  config.logo_posicion  ?? 'centro',
      logo_url:       config.mostrar_logo ? config.logo_url : null,
      copias:         1,
      impresion_enabled: true,
      modo_impresion: config.modo_impresion ?? 'navegador',
    };
  }
}
