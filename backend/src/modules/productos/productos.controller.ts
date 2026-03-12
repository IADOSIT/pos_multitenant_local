import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, Res, ParseIntPipe, BadRequestException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { ProductosService } from './productos.service';

@Controller('productos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductosController {
  private logger = new Logger('ProductosController');
  constructor(private service: ProductosService) {}

  @Get()
  findAll(@TenantScope() scope, @Query('categoria_id') catId?: string) {
    return this.service.findAll(scope, catId ? parseInt(catId) : undefined);
  }

  @Get('pos')
  findForPOS(@TenantScope() scope) {
    return this.service.findForPOS(scope);
  }

  @Get('csv/template')
  @Roles('superadmin', 'admin')
  downloadTemplate(@Res() res: Response) {
    const csv = this.service.getCSVTemplate();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=productos_template.csv');
    res.send('\uFEFF' + csv);
  }

  @Get('image-search')
  @Roles('superadmin', 'admin')
  searchImages(@Query('q') query: string) {
    return this.service.searchImages(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  create(@Body() data: any, @TenantScope() scope) {
    return this.service.create({ ...data, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id });
  }

  @Post('csv/import')
  @Roles('superadmin', 'admin')
  @UseInterceptors(FileInterceptor('file'))
  async importCSV(
    @UploadedFile() file: Express.Multer.File,
    @TenantScope() scope,
    @Query('update') update?: string,
  ) {
    try {
      if (!file) throw new BadRequestException('No se recibió ningún archivo');
      return await this.service.importCSV(file.buffer, scope, update === 'true');
    } catch (err) {
      this.logger.error(`CSV import error: ${err?.message}`, err?.stack);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(err?.message || 'Error procesando el CSV');
    }
  }

  @Post('upload-image')
  @Roles('superadmin', 'admin')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.service.uploadImage(file);
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Post('purge-inactive')
  @Roles('superadmin', 'admin')
  purge(@TenantScope() scope) {
    return this.service.purgeInactive(scope);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteProduct(id);
  }
}
