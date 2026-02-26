import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuDigitalConfig } from './entities/menu-digital-config.entity';
import { MenuDigitalSnapshot } from './entities/menu-digital-snapshot.entity';
import { MenuDigitalLog } from './entities/menu-digital-log.entity';
import { MenuDigitalOrder } from './entities/menu-digital-order.entity';
import { Producto } from '../productos/producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { Tienda } from '../tiendas/tienda.entity';
import { Empresa } from '../empresas/empresa.entity';
import { MenuDigitalService } from './menu-digital.service';
import { MenuDigitalController } from './menu-digital.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuDigitalConfig,
      MenuDigitalSnapshot,
      MenuDigitalLog,
      MenuDigitalOrder,
      Producto,
      Categoria,
      Tienda,
      Empresa,
    ]),
  ],
  controllers: [MenuDigitalController],
  providers: [MenuDigitalService],
  exports: [MenuDigitalService],
})
export class MenuDigitalModule {}
