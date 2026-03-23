import { Controller, Get, Put, Post, Delete, Param, Body, Res, ParseIntPipe, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { BackupService } from './backup.service';

@UseGuards(AuthGuard('jwt'))
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('config')
  getConfig() {
    return this.backupService.getConfig();
  }

  @Put('config')
  updateConfig(@Body() body: any) {
    return this.backupService.updateConfig(body);
  }

  @Get('logs')
  getLogs() {
    return this.backupService.getLogs();
  }

  @Get('files')
  listFiles() {
    return this.backupService.listFiles();
  }

  @Post('ejecutar')
  ejecutar(
    @Body() body: { tipo: 'db' | 'excel' | 'completo'; tienda_id?: number },
    @Request() req: any,
  ) {
    return this.backupService.ejecutarBackup(
      body.tipo || 'completo',
      req.user,
      body.tienda_id || undefined,
    );
  }

  @Get('download/:filename')
  download(@Param('filename') filename: string, @Res() res: Response) {
    const fp = this.backupService.getFilePath(filename);
    if (!fp) return res.status(404).json({ message: 'Archivo no encontrado' });
    res.download(fp, filename);
  }

  @Delete(':id')
  deleteLog(@Param('id', ParseIntPipe) id: number) {
    return this.backupService.deleteLog(id);
  }

  @Post('test-sftp')
  testSFTP() {
    return this.backupService.testSFTP();
  }

  @Post('validar')
  validar(@Body() body: { filename: string }) {
    return this.backupService.validarBackup(body.filename);
  }

  @Post('restaurar')
  restaurar(@Body() body: { filename: string }) {
    return this.backupService.restaurarBackup(body.filename);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importarSQL(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibio archivo');
    if (!file.originalname.endsWith('.sql')) throw new BadRequestException('Solo se permiten archivos .sql');
    return this.backupService.importarSQLBuffer(file.buffer);
  }

  @Post('limpiar-demo')
  limpiarDemo(@Body() body: { ventas: boolean; pedidos: boolean; caja: boolean; inventario: boolean; productos?: boolean; categorias?: boolean }) {
    return this.backupService.limpiarDemoData(body);
  }
}
