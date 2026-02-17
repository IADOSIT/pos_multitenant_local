import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
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

  @Post('preview')
  preview(@Body() data: any, @TenantScope() scope) {
    return this.service.getConfig(scope.tenant_id, scope.empresa_id, scope.tienda_id)
      .then(config => this.service.generateTicketData(data.venta, config));
  }
}
