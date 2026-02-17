import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { CreateUserWizardDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('superadmin', 'admin')
  findAll(@TenantScope() scope) {
    return this.usersService.findAll(scope);
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  findOne(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.usersService.findOne(id, scope);
  }

  @Post('wizard')
  @Roles('superadmin', 'admin')
  createWizard(@Body() dto: CreateUserWizardDto, @TenantScope() scope) {
    return this.usersService.createWithWizard(dto, scope);
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any, @TenantScope() scope) {
    return this.usersService.update(id, data, scope);
  }

  @Patch(':id/toggle')
  @Roles('superadmin', 'admin')
  toggle(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.usersService.toggleActive(id, scope);
  }
}
