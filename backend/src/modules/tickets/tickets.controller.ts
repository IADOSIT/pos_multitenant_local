import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TicketsController {
  constructor(private service: TicketsService) {}

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
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const ext = path.extname(file.originalname) || '.png';
    const filename = `logo-ticket-${Date.now()}${ext}`;
    await fs.writeFile(path.join(uploadDir, filename), file.buffer);
    return { logo_url: `/api/uploads/${filename}` };
  }

  @Post('preview')
  preview(@Body() data: any, @TenantScope() scope) {
    return this.service.getConfig(scope.tenant_id, scope.empresa_id, scope.tienda_id)
      .then(config => this.service.generateTicketData(data.venta, config));
  }
}
