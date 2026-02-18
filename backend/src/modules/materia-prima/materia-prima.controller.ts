import { Controller, Get, Post, Put, Delete, Param, Body, Res, UseGuards, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { MateriaPrimaService } from './materia-prima.service';
import { Response } from 'express';

@Controller('materia-prima')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('superadmin', 'admin')
export class MateriaPrimaController {
  constructor(private service: MateriaPrimaService) {}

  @Get()
  findAll(@TenantScope() scope) {
    return this.service.findAll(scope);
  }

  @Get('csv/template')
  csvTemplate(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=materia_prima_plantilla.csv');
    res.send('\uFEFF' + this.service.getCSVTemplate());
  }

  @Get('csv/export')
  async csvExport(@TenantScope() scope, @Res() res: Response) {
    const csv = await this.service.exportCSV(scope);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=materia_prima_export.csv');
    res.send('\uFEFF' + csv);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.findOne(id, scope);
  }

  @Post()
  create(@Body() data: any, @TenantScope() scope) {
    return this.service.create(data, scope);
  }

  @Post('csv/import')
  @UseInterceptors(FileInterceptor('file'))
  csvImport(@UploadedFile() file: Express.Multer.File, @TenantScope() scope) {
    return this.service.importCSV(file.buffer, scope);
  }

  @Post('delete-all')
  deleteAll(@TenantScope() scope) {
    return this.service.deleteAll(scope);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any, @TenantScope() scope) {
    return this.service.update(id, data, scope);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.delete(id, scope);
  }
}
