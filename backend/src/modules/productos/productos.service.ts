import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { Producto, ProductoTienda } from './producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class ProductosService {
  private logger = new Logger('ProductosService');

  constructor(
    @InjectRepository(Producto) private repo: Repository<Producto>,
    @InjectRepository(ProductoTienda) private ptRepo: Repository<ProductoTienda>,
    @InjectRepository(Categoria) private catRepo: Repository<Categoria>,
    private configService: ConfigService,
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
    // Clean empty strings that would fail on numeric/FK columns
    const clean: any = { ...data };
    if (clean.categoria_id === '' || clean.categoria_id === null) clean.categoria_id = null;
    if (clean.costo === '' || clean.costo === undefined) delete clean.costo;
    if (clean.imagen_url === '') clean.imagen_url = null;
    // Remove relation objects that TypeORM can't update directly
    delete clean.categoria;
    delete clean.tiendas;
    delete clean.id;
    await this.repo.update(id, clean);
    return this.findOne(id);
  }

  getCSVTemplate(): string {
    return 'sku,nombre,descripcion,precio,costo,categoria,unidad,impuesto_pct,codigo_barras,controla_stock,stock_actual,stock_minimo\n'
      + 'PROD001,Hamburguesa Clásica,Carne 150g con lechuga y tomate,89.00,35.00,Hamburguesas,pza,16,7501234567890,false,0,0\n'
      + 'PROD002,Refresco Cola 600ml,Refresco de cola,25.00,12.00,Bebidas,pza,16,,false,0,0';
  }

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

  async importCSV(buffer: Buffer, scope: any, updateExisting: boolean = false) {
    const csvStr = this.decodeCSV(buffer);
    const delimiter = this.detectDelimiter(csvStr);
    this.logger.log(`CSV import: delimiter='${delimiter === '\t' ? 'TAB' : delimiter}', tenant=${scope.tenant_id}, empresa=${scope.empresa_id}, updateExisting=${updateExisting}`);
    // Normalize column names: lowercase, strip accents, underscores
    const normalizeKey = (k: string) => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
    const rawRecords = parse(csvStr, { columns: true, skip_empty_lines: true, trim: true, delimiter });

    // Normalize all keys in each record
    const records = rawRecords.map((r: any) => {
      const norm: any = {};
      for (const [k, v] of Object.entries(r)) norm[normalizeKey(k)] = v;
      return norm;
    });

    const results = { success: 0, errors: [] as any[], updated: 0, total: records.length, columns: [] as string[] };

    if (records.length > 0) {
      results.columns = Object.keys(records[0]);
      this.logger.log(`CSV columns detected: ${results.columns.join(', ')} | rows: ${records.length}`);
    }

    // Pre-load categories for name→id resolution
    const categorias = await this.catRepo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
    });
    const catMap = new Map<string, number>();
    for (const c of categorias) catMap.set(c.nombre.toLowerCase(), c.id);

    // Purge ALL inactive products for this tenant/empresa before import
    await this.purgeInactive(scope);

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

        // Resolve category by name
        let categoriaId: number | null = null;
        if (row.categoria) {
          const catId = catMap.get(row.categoria.toLowerCase());
          if (catId) {
            categoriaId = catId;
          } else {
            const newCat = await this.catRepo.save(this.catRepo.create({
              tenant_id: scope.tenant_id,
              empresa_id: scope.empresa_id,
              nombre: row.categoria,
            }));
            catMap.set(newCat.nombre.toLowerCase(), newCat.id);
            categoriaId = newCat.id;
          }
        }

        const prodData: Partial<Producto> = {
          tenant_id: scope.tenant_id,
          empresa_id: scope.empresa_id,
          sku: row.sku,
          nombre: row.nombre,
          descripcion: row.descripcion || null,
          precio: parseFloat(row.precio),
          costo: row.costo ? parseFloat(row.costo) : 0,
          unidad: row.unidad || 'pza',
          impuesto_pct: row.impuesto_pct ? parseFloat(row.impuesto_pct) : 0,
          codigo_barras: row.codigo_barras || null,
          controla_stock: row.controla_stock === 'true' || row.controla_stock === 'si' || row.controla_stock === '1',
          stock_actual: row.stock_actual ? parseFloat(row.stock_actual) : 0,
          stock_minimo: row.stock_minimo ? parseFloat(row.stock_minimo) : 0,
          activo: true,
          disponible: true,
        };
        if (categoriaId) prodData.categoria_id = categoriaId;

        if (existing) {
          await this.repo.save({ ...existing, ...prodData });
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

  async deleteProduct(id: number) {
    await this.ptRepo.delete({ producto_id: id });
    await this.repo.delete(id);
    return { deleted: true };
  }

  async purgeInactive(scope: any) {
    const inactivos = await this.repo.find({ where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: false } });
    for (const p of inactivos) {
      await this.ptRepo.delete({ producto_id: p.id });
      await this.repo.delete(p.id);
    }
    return { purged: inactivos.length };
  }

  async searchImages(query: string) {
    try {
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=active`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'es-MX,es;q=0.9',
        },
      });
      const html = await res.text();
      const images: { id: number; url: string; thumb: string; alt: string }[] = [];
      // Extract image URLs from Google Images HTML
      const regex = /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)",\s*(\d+),\s*(\d+)\]/gi;
      let match;
      let id = 0;
      while ((match = regex.exec(html)) !== null && images.length < 16) {
        const imgUrl = match[1];
        if (!imgUrl.includes('gstatic.com') && !imgUrl.includes('google.com')) {
          images.push({ id: id++, url: imgUrl, thumb: imgUrl, alt: query });
        }
      }
      return images;
    } catch (err) {
      this.logger.error('Error buscando imagenes en Google', err);
      return [];
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);
    return `/api/uploads/${filename}`;
  }
}
