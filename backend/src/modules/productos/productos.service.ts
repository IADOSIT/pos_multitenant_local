import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { Producto, ProductoTienda } from './producto.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto) private repo: Repository<Producto>,
    @InjectRepository(ProductoTienda) private ptRepo: Repository<ProductoTienda>,
  ) {}

  findAll(scope: any, categoria_id?: number) {
    const where: any = { activo: true };
    if (scope.rol !== UserRole.SUPERADMIN) {
      where.tenant_id = scope.tenant_id;
      where.empresa_id = scope.empresa_id;
    }
    if (categoria_id) where.categoria_id = categoria_id;
    return this.repo.find({ where, relations: ['categoria'], order: { orden: 'ASC', nombre: 'ASC' } });
  }

  findForPOS(scope: any) {
    return this.repo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true, disponible: true },
      relations: ['categoria'],
      order: { categoria: { orden: 'ASC' }, orden: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['categoria'] });
  }

  create(data: Partial<Producto>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Producto>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  getCSVTemplate(): string {
    return 'sku,nombre,descripcion,precio,costo,categoria,unidad,impuesto_pct,codigo_barras,controla_stock,stock_actual,stock_minimo\n'
      + 'PROD001,Hamburguesa Clásica,Carne 150g con lechuga y tomate,89.00,35.00,Hamburguesas,pza,16,7501234567890,false,0,0\n'
      + 'PROD002,Refresco Cola 600ml,Refresco de cola,25.00,12.00,Bebidas,pza,16,,false,0,0';
  }

  async importCSV(buffer: Buffer, scope: any, updateExisting: boolean = false) {
    const records = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
    const results = { success: 0, errors: [], updated: 0, total: records.length };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        if (!row.sku || !row.nombre || !row.precio) {
          results.errors.push({ fila: i + 2, error: 'sku, nombre y precio son obligatorios', datos: row });
          continue;
        }

        const existing = await this.repo.findOne({
          where: { sku: row.sku, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
        });

        if (existing && !updateExisting) {
          results.errors.push({ fila: i + 2, error: `SKU ${row.sku} ya existe`, datos: row });
          continue;
        }

        const prodData: Partial<Producto> = {
          tenant_id: scope.tenant_id,
          empresa_id: scope.empresa_id,
          sku: row.sku,
          nombre: row.nombre,
          descripcion: row.descripcion || null,
          precio: parseFloat(row.precio),
          costo: row.costo ? parseFloat(row.costo) : null,
          unidad: row.unidad || 'pza',
          impuesto_pct: row.impuesto_pct ? parseFloat(row.impuesto_pct) : 0,
          codigo_barras: row.codigo_barras || null,
          controla_stock: row.controla_stock === 'true',
          stock_actual: row.stock_actual ? parseFloat(row.stock_actual) : 0,
          stock_minimo: row.stock_minimo ? parseFloat(row.stock_minimo) : null,
        };

        if (existing) {
          await this.repo.update(existing.id, prodData);
          results.updated++;
        } else {
          await this.repo.save(this.repo.create(prodData));
          results.success++;
        }
      } catch (err) {
        results.errors.push({ fila: i + 2, error: err.message, datos: row });
      }
    }
    return results;
  }
}
