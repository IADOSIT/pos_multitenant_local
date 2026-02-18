import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
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
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const ext = path.extname(file.originalname) || '.png';
    const filename = `logo-empresa-${id}-${Date.now()}${ext}`;
    await fs.writeFile(path.join(uploadDir, filename), file.buffer);
    const logoUrl = `/api/uploads/${filename}`;
    await this.service.update(id, { logo_url: logoUrl });
    return { logo_url: logoUrl };
  }

  @Delete(':id')
  @Roles('superadmin')
  delete(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
