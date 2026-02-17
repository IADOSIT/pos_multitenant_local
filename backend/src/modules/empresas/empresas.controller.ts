import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
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
}
