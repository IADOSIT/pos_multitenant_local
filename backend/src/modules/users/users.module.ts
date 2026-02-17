import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Empresa } from '../empresas/empresa.entity';
import { Tienda } from '../tiendas/tienda.entity';
import { Auditoria } from '../ventas/auditoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant, Empresa, Tienda, Auditoria])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
