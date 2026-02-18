import { Controller, Get, Post, Put, Param, Body, Res, UseGuards, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { InventarioService } from './inventario.service';
import { Response } from 'express';

@Controller('inventario')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('superadmin', 'admin', 'manager')
export class InventarioController {
  constructor(private service: InventarioService) {}

  @Get('stock')
  listStock(@TenantScope() scope) {
    return this.service.listStock(scope);
  }

  @Get('movimientos')
  listMovimientos(@TenantScope() scope) {
    return this.service.listMovimientos(scope);
  }

  @Get('movimientos/:productoId')
  getMovimientos(@Param('productoId', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.getMovimientos(id, scope);
  }

  @Post('movimiento')
  registrarMovimiento(@Body() data: any, @TenantScope() scope) {
    return this.service.registrarMovimiento(data, scope);
  }

  @Put('producto/:id')
  updateProducto(@Param('id', ParseIntPipe) id: number, @Body() data: any, @TenantScope() scope) {
    return this.service.updateProducto(id, data, scope);
  }

  @Get('csv/template')
  csvTemplate(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario_template.csv');
    res.send('\uFEFF' + this.service.getCSVTemplate());
  }

  @Get('csv/export')
  async csvExport(@TenantScope() scope, @Res() res: Response) {
    const csv = await this.service.exportCSV(scope);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario_export.csv');
    res.send('\uFEFF' + csv);
  }

  @Post('csv/import')
  @UseInterceptors(FileInterceptor('file'))
  csvImport(@UploadedFile() file: Express.Multer.File, @TenantScope() scope) {
    return this.service.importCSV(file.buffer, scope);
  }
}
