import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoInventario } from './inventario.entity';
import { Producto, ProductoTienda } from '../productos/producto.entity';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { EmpresasModule } from '../empresas/empresas.module';

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoInventario, Producto, ProductoTienda]), EmpresasModule],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
