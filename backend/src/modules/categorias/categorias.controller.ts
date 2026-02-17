import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { CategoriasService } from './categorias.service';

@Controller('categorias')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CategoriasController {
  constructor(private service: CategoriasService) {}

  @Get()
  findAll(@TenantScope() scope) { return this.service.findAll(scope); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles('superadmin', 'admin')
  create(@Body() data: any, @TenantScope() scope) {
    return this.service.create({ ...data, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id });
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.update(id, data); }
}
