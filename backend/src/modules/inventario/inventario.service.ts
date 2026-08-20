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

  // Roles que pueden operar/ver el stock de cualquier tienda de su empresa, no solo la
  // tienda fija de su usuario.
  private adminRoles = ['superadmin', 'admin', 'manager'];

  // Resuelve la tienda efectiva para una operacion: por defecto la tienda fija del usuario
  // (scope.tienda_id), pero si el rol es admin/manager/superadmin y manda una tienda de su
  // misma empresa, se respeta esa en su lugar. Asi el admin puede ver/operar cualquier
  // sucursal desde su misma cuenta sin tener que loguearse como otro usuario; un cajero
  // nunca puede salirse de su propia tienda (el override se ignora silenciosamente).
  private async resolveTiendaId(scope: any, tiendaIdOverride?: number): Promise<number> {
    if (tiendaIdOverride && this.adminRoles.includes(scope.rol)) {
      const tienda = await this.ptRepo.manager.query(
        'SELECT id FROM tiendas WHERE id = ? AND empresa_id = ?',
        [tiendaIdOverride, scope.empresa_id],
      );
      if (tienda.length > 0) return tiendaIdOverride;
    }
    return scope.tienda_id;
  }

  // List products with stock info. Con "inventario compartido" activo, el stock mostrado
  // es el de una tienda especifica (producto_tienda), no el acumulado de la empresa.
  async listStock(scope: any, tiendaIdOverride?: number) {
    const where: any = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true };
    if (scope.modulo && !this.adminRoles.includes(scope.rol)) {
      where.modulo = scope.modulo;
    }
    const productos = await this.prodRepo.find({
      where,
      select: ['id', 'sku', 'nombre', 'stock_actual', 'stock_minimo', 'controla_stock', 'unidad', 'costo', 'precio', 'imagen_url'],
      order: { nombre: 'ASC' },
    });
    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    const tiendaId = await this.resolveTiendaId(scope, tiendaIdOverride);

    if (!inventario_compartido || !tiendaId || productos.length === 0) return productos;
    const ptRows = await this.ptRepo.find({ where: { tienda_id: tiendaId, producto_id: In(productos.map((p) => p.id)) } });
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
    tienda_id?: number;
  }, scope: any) {
    const prod = await this.prodRepo.findOne({ where: { id: data.producto_id, tenant_id: scope.tenant_id } });
    if (!prod) throw new BadRequestException('Producto no encontrado');

    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    const tiendaId = await this.resolveTiendaId(scope, data.tienda_id);
    const usaPorTienda = inventario_compartido && !!tiendaId;

    let pt: ProductoTienda | null = null;
    let stockAnterior: number;
    if (usaPorTienda) {
      pt = await this.ptRepo.findOne({ where: { producto_id: prod.id, tienda_id: tiendaId } });
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
      tienda_id: tiendaId,
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
      if (!pt) pt = this.ptRepo.create({ tenant_id: scope.tenant_id, tienda_id: tiendaId, producto_id: prod.id, disponible: true });
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

  async importCSV(buffer: Buffer, scope: any, tiendaIdOverride?: number) {
    const csvStr = this.decodeCSV(buffer);
    const delimiter = this.detectDelimiter(csvStr);
    const records = parse(csvStr, { columns: true, skip_empty_lines: true, trim: true, delimiter });
    const results = { success: 0, errors: [] as any[], total: records.length };

    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    const tiendaId = await this.resolveTiendaId(scope, tiendaIdOverride);
    const usaPorTienda = inventario_compartido && !!tiendaId;

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
          ? Number((pt = await this.ptRepo.findOne({ where: { producto_id: prod.id, tienda_id: tiendaId } }))?.stock || 0)
          : Number(prod.stock_actual || 0);
        const stockNuevo = row.stock_actual !== undefined && row.stock_actual !== '' ? parseFloat(row.stock_actual) : stockAnterior;

        if (stockNuevo !== stockAnterior) {
          await this.movRepo.save(this.movRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: tiendaId,
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
          if (!pt) pt = this.ptRepo.create({ tenant_id: scope.tenant_id, tienda_id: tiendaId, producto_id: prod.id, disponible: true });
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

  // Vista general de inventario compartido: 100% del catalogo de la empresa (no solo los
  // productos con controla_stock), con el desglose de stock+precio por CADA tienda activa
  // de la empresa. La lista de tiendas se calcula dinamicamente (no se asume que sean 2) y
  // se manda aparte para que el frontend arme columnas dinamicas sin repetir "stock"/"precio"
  // en cada encabezado. Stock/precio real vive en producto_tienda; si un producto no tiene
  // fila ahi para una tienda (nunca se le asigno stock local), se muestra en 0 con el precio
  // base del producto.
  async getVistaGeneral(scope: any) {
    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    if (!inventario_compartido) {
      throw new BadRequestException('El inventario compartido no esta habilitado para esta empresa');
    }
    const tiendas: { id: number; nombre: string }[] = await this.ptRepo.manager.query(
      'SELECT id, nombre FROM tiendas WHERE empresa_id = ? AND activo = 1 ORDER BY id ASC',
      [scope.empresa_id],
    );
    const productos = await this.prodRepo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
      select: ['id', 'sku', 'nombre', 'stock_minimo', 'unidad', 'precio', 'categoria_id'],
      order: { orden: 'ASC', nombre: 'ASC' },
    });
    if (productos.length === 0 || tiendas.length === 0) return { tiendas, productos: [] };

    const categoriaIds = [...new Set(productos.map((p) => p.categoria_id).filter(Boolean))];
    const categorias: { id: number; nombre: string; orden: number }[] = categoriaIds.length
      ? await this.ptRepo.manager.query(
          `SELECT id, nombre, orden FROM categorias WHERE id IN (${categoriaIds.map(() => '?').join(',')}) ORDER BY orden ASC, nombre ASC`,
          categoriaIds,
        )
      : [];
    const catMap = new Map(categorias.map((c) => [c.id, c.nombre]));
    const catOrdenMap = new Map(categorias.map((c, idx) => [c.id, idx]));

    const tiendaIds = tiendas.map((t) => t.id);
    const ptRows = await this.ptRepo.find({
      where: { producto_id: In(productos.map((p) => p.id)), tienda_id: In(tiendaIds) },
    });
    const ptMap = new Map<string, { stock: number; precio_local: number | null }>();
    for (const pt of ptRows) {
      ptMap.set(`${pt.producto_id}:${pt.tienda_id}`, {
        stock: Number(pt.stock),
        precio_local: pt.precio_local != null ? Number(pt.precio_local) : null,
      });
    }

    const result = productos.map((p) => {
      const precioBase = Number(p.precio);
      const porTienda = tiendas.map((t) => {
        const row = ptMap.get(`${p.id}:${t.id}`);
        return {
          tienda_id: t.id,
          tienda_nombre: t.nombre,
          stock: row?.stock ?? 0,
          precio: row?.precio_local ?? precioBase,
        };
      });
      const stockTotal = porTienda.reduce((sum, t) => sum + t.stock, 0);
      return {
        id: p.id, sku: p.sku, nombre: p.nombre, stock_minimo: Number(p.stock_minimo || 0), unidad: p.unidad,
        precio: precioBase, stock_total: stockTotal, por_tienda: porTienda,
        categoria_id: p.categoria_id || 0,
        categoria_nombre: p.categoria_id ? (catMap.get(p.categoria_id) || 'Sin categoria') : 'Sin categoria',
      };
    });

    // Ordena por categoria (respetando el orden de categorias.orden) y dentro de cada
    // categoria conserva el orden de catalogo que ya trae `productos`.
    result.sort((a, b) => {
      const oa = catOrdenMap.get(a.categoria_id) ?? 9999;
      const ob = catOrdenMap.get(b.categoria_id) ?? 9999;
      return oa - ob;
    });

    return { tiendas, productos: result };
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
  async exportCSV(scope: any, tiendaIdOverride?: number): Promise<string> {
    const productos = await this.prodRepo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
      order: { nombre: 'ASC' },
    });
    const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
    const tiendaId = await this.resolveTiendaId(scope, tiendaIdOverride);
    let ptMap = new Map<number, number>();
    if (inventario_compartido && tiendaId && productos.length > 0) {
      const ptRows = await this.ptRepo.find({ where: { tienda_id: tiendaId, producto_id: In(productos.map((p) => p.id)) } });
      ptMap = new Map(ptRows.map((pt) => [pt.producto_id, Number(pt.stock)]));
    }
    let csv = 'sku,nombre,stock_actual,stock_minimo,controla_stock,costo,precio,unidad\n';
    for (const p of productos) {
      const stock = inventario_compartido && tiendaId ? (ptMap.get(p.id) ?? 0) : (p.stock_actual || 0);
      csv += `${p.sku},"${p.nombre}",${stock},${p.stock_minimo || 0},${p.controla_stock},${p.costo || 0},${p.precio},${p.unidad || 'pza'}\n`;
    }
    return csv;
  }
}
