import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { EncuestasService } from './encuestas.service';

@Controller('encuestas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EncuestasController {
  constructor(private service: EncuestasService) {}

  @Get()
  findAll(@TenantScope() scope, @Query('limit') limit?: string) {
    return this.service.findAll(scope, limit ? parseInt(limit) : 50);
  }

  @Get('kpis')
  getKPIs(@TenantScope() scope, @Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.service.getKPIs(scope, desde, hasta);
  }
}
