import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto, ProductoTienda } from './producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { ConfigIaImagenes } from './config-ia-imagenes.entity';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, ProductoTienda, Categoria, ConfigIaImagenes])],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService],
})
export class ProductosModule {}
