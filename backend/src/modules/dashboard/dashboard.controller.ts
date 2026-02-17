import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('superadmin', 'admin', 'manager')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('kpi')
  getKPI(
    @TenantScope() scope,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Query('tienda_id') tiendaId?: string,
  ) {
    return this.service.getKPI(scope, desde, hasta, tiendaId ? parseInt(tiendaId) : undefined);
  }

  @Get('tendencia')
  getTendencia(@TenantScope() scope, @Query('semanas') semanas?: string) {
    return this.service.getTendencia(scope, semanas ? parseInt(semanas) : 4);
  }
}
