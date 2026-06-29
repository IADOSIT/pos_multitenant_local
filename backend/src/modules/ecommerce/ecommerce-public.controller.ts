import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EcommerceService } from './ecommerce.service';

@Controller('public/tienda')
export class EcommercePublicController {
  constructor(
    private service: EcommerceService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Get(':subdominio/info')
  getInfo(@Param('subdominio') sub: string) {
    return this.service.getPublicInfo(sub, this.dataSource);
  }

  @Get(':subdominio/categorias')
  getCategorias(@Param('subdominio') sub: string) {
    return this.service.getPublicCategorias(sub, this.dataSource);
  }

  @Get(':subdominio/productos')
  getProductos(@Param('subdominio') sub: string, @Query() query: any) {
    return this.service.getPublicProductos(sub, this.dataSource, query);
  }

  @Get(':subdominio/productos/:slug')
  getProducto(@Param('subdominio') sub: string, @Param('slug') slug: string) {
    return this.service.getPublicProductoBySlug(sub, slug, this.dataSource);
  }

  @Post(':subdominio/pedidos')
  crearPedido(@Param('subdominio') sub: string, @Body() body: any) {
    return this.service.crearPedidoPublico(sub, body, this.dataSource);
  }

  @Get(':subdominio/pedidos/:numero')
  trackPedido(@Param('subdominio') sub: string, @Param('numero') numero: string) {
    return this.service.getPublicPedido(sub, numero, this.dataSource);
  }
}
