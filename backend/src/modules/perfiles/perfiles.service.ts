import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilNegocio } from './perfil-negocio.entity';
import { TenantPerfil } from './tenant-perfil.entity';
import { Producto } from '../productos/producto.entity';
import { Categoria } from '../categorias/categoria.entity';

@Injectable()
export class PerfilesService {
  constructor(
    @InjectRepository(PerfilNegocio) private perfilRepo: Repository<PerfilNegocio>,
    @InjectRepository(TenantPerfil) private tenantPerfilRepo: Repository<TenantPerfil>,
    @InjectRepository(Producto) private productoRepo: Repository<Producto>,
    @InjectRepository(Categoria) private categoriaRepo: Repository<Categoria>,
  ) {}

  async getPerfilActivo(tenant_id: number): Promise<any> {
    const tp = await this.tenantPerfilRepo.findOne({
      where: { tenant_id, activo: true },
    });
    if (!tp) return null;

    const perfil = await this.perfilRepo.findOne({ where: { clave: tp.perfil_clave, activo: true } });
    if (!perfil) return null;

    const config = {
      ...(perfil.config || {}),
      ...(tp.config_override || {}),
    };

    return { ...perfil, config, tenant_perfil_id: tp.id };
  }

  private getCarbonHieloConfig() {
    return {
      modulos: ['carbon', 'hielo'],
      modulos_config: {
        carbon: { label: 'Carbón', color: '#374151', icono: 'Flame' },
        hielo:  { label: 'Hielo',  color: '#0ea5e9', icono: 'Snowflake' },
      },
      inventario_critico: true,
      alertas_stock: true,
      productos_base: [
        { modulo: 'carbon', sku: 'CARB-3KG',   nombre: 'Carbón Bolsa 3kg',   unidad: 'bolsa', precio: 0, costo: 0, controla_stock: true, stock_minimo: 20 },
        { modulo: 'carbon', sku: 'CARB-2.5KG', nombre: 'Carbón Bolsa 2.5kg', unidad: 'bolsa', precio: 0, costo: 0, controla_stock: true, stock_minimo: 20 },
        { modulo: 'carbon', sku: 'CARB-GRAN',  nombre: 'Carbón Granel kg',   unidad: 'kg',    precio: 0, costo: 0, controla_stock: true, stock_minimo: 50 },
        { modulo: 'hielo',  sku: 'HIEL-5KG',   nombre: 'Hielo Bolsa 5kg',    unidad: 'bolsa', precio: 0, costo: 0, controla_stock: true, stock_minimo: 30 },
        { modulo: 'hielo',  sku: 'HIEL-20KG',  nombre: 'Hielo Bolsa 20kg',   unidad: 'bolsa', precio: 0, costo: 0, controla_stock: true, stock_minimo: 10 },
        { modulo: 'hielo',  sku: 'HIEL-BARR',  nombre: 'Hielo Barra',        unidad: 'pieza', precio: 0, costo: 0, controla_stock: true, stock_minimo: 5  },
      ],
    };
  }

  async activarPerfil(
    tenant_id: number,
    empresa_id: number,
    tienda_id: number,
    perfil_clave: string,
    scope: any,
  ): Promise<any> {
    let perfil = await this.perfilRepo.findOne({ where: { clave: perfil_clave } });

    // Auto-seed si no existe en la tabla (ej: VPS donde solo corre TypeORM synchronize)
    if (!perfil) {
      if (perfil_clave === 'carbon_hielo') {
        perfil = await this.perfilRepo.save(
          this.perfilRepo.create({
            clave: 'carbon_hielo',
            nombre: 'Carbón + Hielo',
            descripcion: 'Perfil para negocios de venta de carbón y hielo con inventario dual',
            config: this.getCarbonHieloConfig(),
            activo: true,
          }),
        );
      } else {
        throw new BadRequestException(`Perfil '${perfil_clave}' no encontrado`);
      }
    }

    if (!perfil.activo) throw new BadRequestException(`Perfil '${perfil_clave}' no encontrado`);

    let tp = await this.tenantPerfilRepo.findOne({ where: { tenant_id, perfil_clave } });
    if (tp) {
      tp.activo = true;
      await this.tenantPerfilRepo.save(tp);
    } else {
      tp = await this.tenantPerfilRepo.save(
        this.tenantPerfilRepo.create({ tenant_id, perfil_clave, activo: true }),
      );
    }

    let seed: any = null;
    if (perfil_clave === 'carbon_hielo') {
      seed = await this.seedCarbonHielo(tenant_id, empresa_id, scope);
    }

    return { perfil, tenant_perfil: tp, seed };
  }

  async desactivarPerfil(tenant_id: number, perfil_clave: string): Promise<void> {
    await this.tenantPerfilRepo.update({ tenant_id, perfil_clave }, { activo: false });
  }

  async seedCarbonHielo(tenant_id: number, empresa_id: number, scope: any): Promise<any> {
    const perfil = await this.perfilRepo.findOne({ where: { clave: 'carbon_hielo' } });
    const productosBase = perfil?.config?.productos_base ?? this.getCarbonHieloConfig().productos_base;
    if (!productosBase?.length) return { categorias: [], productos: [] };

    const categoriasCreadas: any[] = [];
    const productosCreados: any[] = [];

    // Crear categoría Carbón
    let catCarbon = await this.categoriaRepo.findOne({
      where: { tenant_id, empresa_id, nombre: 'Carbón' },
    });
    if (!catCarbon) {
      catCarbon = await this.categoriaRepo.save(
        this.categoriaRepo.create({
          tenant_id,
          empresa_id,
          nombre: 'Carbón',
          color: '#374151',
          icono: 'Flame',
          orden: 90,
          activo: true,
          modulo: 'carbon',
        }),
      );
      categoriasCreadas.push(catCarbon);
    }

    // Crear categoría Hielo
    let catHielo = await this.categoriaRepo.findOne({
      where: { tenant_id, empresa_id, nombre: 'Hielo' },
    });
    if (!catHielo) {
      catHielo = await this.categoriaRepo.save(
        this.categoriaRepo.create({
          tenant_id,
          empresa_id,
          nombre: 'Hielo',
          color: '#0ea5e9',
          icono: 'Snowflake',
          orden: 91,
          activo: true,
          modulo: 'hielo',
        }),
      );
      categoriasCreadas.push(catHielo);
    }

    // Crear productos base
    for (const pb of productosBase) {
      const existe = await this.productoRepo.findOne({
        where: { sku: pb.sku, tenant_id, empresa_id },
      });
      if (existe) continue;

      const catId = pb.modulo === 'carbon' ? catCarbon.id : catHielo.id;
      const prod = await this.productoRepo.save(
        this.productoRepo.create({
          tenant_id,
          empresa_id,
          sku: pb.sku,
          nombre: pb.nombre,
          precio: pb.precio ?? 0,
          costo: pb.costo ?? 0,
          unidad: pb.unidad ?? 'pza',
          controla_stock: pb.controla_stock ?? true,
          stock_minimo: pb.stock_minimo ?? 0,
          stock_actual: 0,
          categoria_id: catId,
          activo: true,
          disponible: true,
          modulo: pb.modulo,
        }),
      );
      productosCreados.push(prod);
    }

    return { categorias: categoriasCreadas, productos: productosCreados };
  }

  async getAlertasStock(tenant_id: number, empresa_id: number, modulo?: string): Promise<any[]> {
    const qb = this.productoRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenant_id', { tenant_id })
      .andWhere('p.empresa_id = :empresa_id', { empresa_id })
      .andWhere('p.controla_stock = 1')
      .andWhere('p.activo = 1')
      .andWhere('p.stock_actual <= p.stock_minimo');

    if (modulo) qb.andWhere('p.modulo = :modulo', { modulo });

    const productos = await qb
      .select(['p.id', 'p.sku', 'p.nombre', 'p.stock_actual', 'p.stock_minimo', 'p.unidad', 'p.modulo'])
      .orderBy('p.stock_actual', 'ASC')
      .getRawMany();

    return productos.map((p) => ({
      id: p.p_id,
      sku: p.p_sku,
      nombre: p.p_nombre,
      stock_actual: Number(p.p_stock_actual),
      stock_minimo: Number(p.p_stock_minimo),
      unidad: p.p_unidad,
      modulo: p.p_modulo,
      deficit: Number(p.p_stock_minimo) - Number(p.p_stock_actual),
    }));
  }

  async getResumenModulo(tenant_id: number, empresa_id: number, modulo: string): Promise<any> {
    const todos = await this.productoRepo.find({
      where: { tenant_id, empresa_id, activo: true, modulo },
    });

    const conStock = todos.filter((p) => p.controla_stock);
    const alertas = conStock.filter((p) => Number(p.stock_actual) <= Number(p.stock_minimo));
    const stockBajo = conStock.filter(
      (p) => Number(p.stock_actual) <= Number(p.stock_minimo) * 2 && Number(p.stock_actual) > Number(p.stock_minimo),
    );

    return {
      modulo,
      total_productos: todos.length,
      alertas_criticas: alertas.length,
      stock_bajo: stockBajo.length,
    };
  }
}
