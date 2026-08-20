import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MovimientoInventario, MovimientoTipo } from './inventario.entity';
import { Producto, ProductoTienda } from '../productos/producto.entity';
import { EmpresasService } from '../empresas/empresas.service';
import { parse } from 'csv-parse/sync';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(MovimientoInventario) private movRepo: Repository<MovimientoInventario>,
    @InjectRepository(Producto) private prodRepo: Repository<Producto>,
    @InjectRepository(ProductoTienda) private ptRepo: Repository<ProductoTienda>,
    private empresasService: EmpresasService,
  ) {}

  // List products with stock info. Con "inventario compartido" activo, el stock mostrado
  // es el de la tienda del usuario (producto_tienda), no el acumulado de la empresa.
  async listStock(scope: any) {
    const adminRoles = ['superadmin', 'admin', 'manager'];
    const where: any = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true };
    if (scope.modulo && !adminRoles.includes(scope.rol)) {
      where.modulo = scope.modulo;
    }
    const productos = await this.prodRepo.find({
      where,
      select: ['id', 'sku', 'nombre', 'stock_actual', 'stock_minimo', 'controla_stock', 'unidad', 'costo', 'precio', 'imagen_url'],
      order: { nombre: 'ASC' },
    });
    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    if (!inventario_compartido || !scope.tienda_id || productos.length === 0) return productos;
    const ptRows = await this.ptRepo.find({ where: { tienda_id: scope.tienda_id, producto_id: In(productos.map((p) => p.id)) } });
    const ptMap = new Map(ptRows.map((pt) => [pt.producto_id, Number(pt.stock)]));
    return productos.map((p) => (p.controla_stock ? { ...p, stock_actual: ptMap.get(p.id) ?? 0 } : p));
  }

  // Get movements for a product
  async getMovimientos(productoId: number, scope: any) {
    return this.movRepo.find({
      where: { producto_id: productoId, tenant_id: scope.tenant_id },
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  // All recent movements
  async listMovimientos(scope: any) {
    return this.movRepo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
      order: { created_at: 'DESC' },
      take: 200,
    });
  }

  // Register stock movement
  async registrarMovimiento(data: {
    producto_id: number;
    tipo: MovimientoTipo;
    cantidad: number;
    concepto?: string;
  }, scope: any) {
    const prod = await this.prodRepo.findOne({ where: { id: data.producto_id, tenant_id: scope.tenant_id } });
    if (!prod) throw new BadRequestException('Producto no encontrado');

    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    const usaPorTienda = inventario_compartido && !!scope.tienda_id;

    let pt: ProductoTienda | null = null;
    let stockAnterior: number;
    if (usaPorTienda) {
      pt = await this.ptRepo.findOne({ where: { producto_id: prod.id, tienda_id: scope.tienda_id } });
      stockAnterior = Number(pt?.stock || 0);
    } else {
      stockAnterior = Number(prod.stock_actual || 0);
    }
    let stockNuevo: number;

    switch (data.tipo) {
      case MovimientoTipo.ENTRADA:
      case MovimientoTipo.DEVOLUCION:
        stockNuevo = stockAnterior + Number(data.cantidad);
        break;
      case MovimientoTipo.SALIDA:
        stockNuevo = stockAnterior - Number(data.cantidad);
        break;
      case MovimientoTipo.AJUSTE:
        stockNuevo = Number(data.cantidad); // absolute value
        break;
      default:
        throw new BadRequestException('Tipo invalido');
    }

    const mov = await this.movRepo.save(this.movRepo.create({
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      tienda_id: scope.tienda_id,
      producto_id: prod.id,
      producto_nombre: prod.nombre,
      producto_sku: prod.sku,
      tipo: data.tipo,
      cantidad: data.cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      concepto: data.concepto || undefined,
      usuario_id: scope.id || scope.sub,
      usuario_nombre: scope.nombre || 'Sistema',
    }));

    if (usaPorTienda) {
      if (!pt) pt = this.ptRepo.create({ tenant_id: scope.tenant_id, tienda_id: scope.tienda_id, producto_id: prod.id, disponible: true });
      pt.stock = stockNuevo;
      await this.ptRepo.save(pt);
    } else {
      prod.stock_actual = stockNuevo;
    }
    prod.controla_stock = true;
    await this.prodRepo.save(prod);

    return { movimiento: mov, stock_actual: stockNuevo };
  }

  // Update stock settings
  async updateProducto(id: number, data: { controla_stock?: boolean; stock_minimo?: number }, scope: any) {
    const prod = await this.prodRepo.findOne({ where: { id, tenant_id: scope.tenant_id } });
    if (!prod) throw new BadRequestException('Producto no encontrado');
    if (data.controla_stock !== undefined) prod.controla_stock = data.controla_stock;
    if (data.stock_minimo !== undefined) prod.stock_minimo = data.stock_minimo;
    return this.prodRepo.save(prod);
  }

  // CSV Template
  getCSVTemplate(): string {
    return 'sku,stock_actual,stock_minimo,controla_stock\nPROD001,50,5,true\nPROD002,100,10,true';
  }

  // CSV Import
  private decodeCSV(buffer: Buffer): string {
    let str = buffer.toString('utf-8');
    if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
    if (str.includes('\ufffd')) str = buffer.toString('latin1');
    return str;
  }

  private detectDelimiter(csvStr: string): string {
    const firstLine = csvStr.split(/\r?\n/)[0] || '';
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    if (semicolons > commas && semicolons > tabs) return ';';
    if (tabs > commas && tabs > semicolons) return '\t';
    return ',';
  }

  async importCSV(buffer: Buffer, scope: any) {
    const csvStr = this.decodeCSV(buffer);
    const delimiter = this.detectDelimiter(csvStr);
    const records = parse(csvStr, { columns: true, skip_empty_lines: true, trim: true, delimiter });
    const results = { success: 0, errors: [] as any[], total: records.length };

    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    const usaPorTienda = inventario_compartido && !!scope.tienda_id;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        if (!row.sku) {
          results.errors.push({ fila: i + 2, error: 'SKU obligatorio' });
          continue;
        }
        const prod = await this.prodRepo.findOne({
          where: { sku: row.sku, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
        });
        if (!prod) {
          results.errors.push({ fila: i + 2, error: `SKU ${row.sku} no encontrado` });
          continue;
        }

        let pt: ProductoTienda | null = null;
        const stockAnterior = usaPorTienda
          ? Number((pt = await this.ptRepo.findOne({ where: { producto_id: prod.id, tienda_id: scope.tienda_id } }))?.stock || 0)
          : Number(prod.stock_actual || 0);
        const stockNuevo = row.stock_actual !== undefined && row.stock_actual !== '' ? parseFloat(row.stock_actual) : stockAnterior;

        if (stockNuevo !== stockAnterior) {
          await this.movRepo.save(this.movRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
            producto_id: prod.id,
            producto_nombre: prod.nombre,
            producto_sku: prod.sku,
            tipo: MovimientoTipo.AJUSTE,
            cantidad: stockNuevo,
            stock_anterior: stockAnterior,
            stock_nuevo: stockNuevo,
            concepto: 'Importacion CSV',
            usuario_id: scope.id || scope.sub,
            usuario_nombre: scope.nombre || 'Sistema',
          }));
        }

        if (usaPorTienda) {
          if (!pt) pt = this.ptRepo.create({ tenant_id: scope.tenant_id, tienda_id: scope.tienda_id, producto_id: prod.id, disponible: true });
          pt.stock = stockNuevo;
          await this.ptRepo.save(pt);
        } else {
          prod.stock_actual = stockNuevo;
        }
        if (row.stock_minimo !== undefined && row.stock_minimo !== '') prod.stock_minimo = parseFloat(row.stock_minimo);
        if (row.controla_stock !== undefined && row.controla_stock !== '') prod.controla_stock = row.controla_stock === 'true';
        await this.prodRepo.save(prod);
        results.success++;
      } catch (err: any) {
        results.errors.push({ fila: i + 2, error: err.message });
      }
    }
    return results;
  }

  // Vista general de inventario compartido: total de la empresa + desglose por tienda.
  // Solo tiene sentido con inventario_compartido activo (stock real vive en producto_tienda).
  async getVistaGeneral(scope: any) {
    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    if (!inventario_compartido) {
      throw new BadRequestException('El inventario compartido no esta habilitado para esta empresa');
    }
    const productos = await this.prodRepo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true, controla_stock: true },
      select: ['id', 'sku', 'nombre', 'stock_minimo', 'unidad'],
      order: { nombre: 'ASC' },
    });
    if (productos.length === 0) return [];

    const rows = await this.ptRepo.createQueryBuilder('pt')
      .innerJoin('tiendas', 't', 't.id = pt.tienda_id')
      .where('pt.producto_id IN (:...ids)', { ids: productos.map((p) => p.id) })
      .andWhere('t.empresa_id = :eid', { eid: scope.empresa_id })
      .andWhere('t.activo = 1')
      .select(['pt.producto_id AS producto_id', 'pt.tienda_id AS tienda_id', 't.nombre AS tienda_nombre', 'pt.stock AS stock'])
      .getRawMany();

    const porProducto = new Map<number, { tienda_id: number; tienda_nombre: string; stock: number }[]>();
    for (const r of rows) {
      const list = porProducto.get(Number(r.producto_id)) || [];
      list.push({ tienda_id: Number(r.tienda_id), tienda_nombre: r.tienda_nombre, stock: Number(r.stock) });
      porProducto.set(Number(r.producto_id), list);
    }

    return productos.map((p) => {
      const porTienda = porProducto.get(p.id) || [];
      const stockTotal = porTienda.reduce((sum, t) => sum + t.stock, 0);
      return {
        id: p.id, sku: p.sku, nombre: p.nombre, stock_minimo: p.stock_minimo, unidad: p.unidad,
        stock_total: stockTotal,
        por_tienda: porTienda,
      };
    });
  }

  async listStockPorModulo(scope: any, modulo?: string) {
    const where: any = {
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      activo: true,
    };
    if (modulo) where.modulo = modulo;
    return this.prodRepo.find({
      where,
      select: ['id', 'sku', 'nombre', 'stock_actual', 'stock_minimo', 'controla_stock', 'unidad', 'costo', 'precio', 'imagen_url', 'modulo'],
      order: { nombre: 'ASC' },
    });
  }

  // CSV Export current stock
  async exportCSV(scope: any): Promise<string> {
    const productos = await this.prodRepo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
      order: { nombre: 'ASC' },
    });
    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    let ptMap = new Map<number, number>();
    if (inventario_compartido && scope.tienda_id && productos.length > 0) {
      const ptRows = await this.ptRepo.find({ where: { tienda_id: scope.tienda_id, producto_id: In(productos.map((p) => p.id)) } });
      ptMap = new Map(ptRows.map((pt) => [pt.producto_id, Number(pt.stock)]));
    }
    let csv = 'sku,nombre,stock_actual,stock_minimo,controla_stock,costo,precio,unidad\n';
    for (const p of productos) {
      const stock = inventario_compartido && scope.tienda_id ? (ptMap.get(p.id) ?? 0) : (p.stock_actual || 0);
      csv += `${p.sku},"${p.nombre}",${stock},${p.stock_minimo || 0},${p.controla_stock},${p.costo || 0},${p.precio},${p.unidad || 'pza'}\n`;
    }
    return csv;
  }
}
