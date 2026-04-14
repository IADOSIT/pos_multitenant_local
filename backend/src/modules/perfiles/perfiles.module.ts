import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilNegocio } from './perfil-negocio.entity';
import { TenantPerfil } from './tenant-perfil.entity';
import { Producto } from '../productos/producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { PerfilesService } from './perfiles.service';
import { PerfilesController } from './perfiles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilNegocio, TenantPerfil, Producto, Categoria])],
  controllers: [PerfilesController],
  providers: [PerfilesService],
  exports: [PerfilesService],
})
export class PerfilesModule {}
