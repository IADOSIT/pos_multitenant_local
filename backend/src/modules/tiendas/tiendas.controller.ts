import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { TiendasService } from './tiendas.service';

@Controller('tiendas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('superadmin', 'admin', 'manager')
export class TiendasController {
  constructor(private service: TiendasService) {}

  @Get()
  findAll(@TenantScope() scope) { return this.service.findAll(scope); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles('superadmin', 'admin')
  create(@Body() data: any) { return this.service.create(data); }

  @Put(':id')
  @Roles('superadmin', 'admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.update(id, data); }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  delete(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
