import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { Producto, ProductoTienda } from './producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { ConfigIaImagenes } from './config-ia-imagenes.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class ProductosService {
  private logger = new Logger('ProductosService');

  constructor(
    @InjectRepository(Producto) private repo: Repository<Producto>,
    @InjectRepository(ProductoTienda) private ptRepo: Repository<ProductoTienda>,
    @InjectRepository(Categoria) private catRepo: Repository<Categoria>,
    @InjectRepository(ConfigIaImagenes) private iaImagenesRepo: Repository<ConfigIaImagenes>,
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
    const adminRoles = ['admin', 'superadmin', 'manager'];
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c')
      .where('p.tenant_id = :tid AND p.empresa_id = :eid AND p.activo = :activo AND p.disponible = :disponible', {
        tid: scope.tenant_id,
        eid: scope.empresa_id,
        activo: true,
        disponible: true,
      })
      .orderBy('c.orden', 'ASC')
      .addOrderBy('p.orden', 'ASC');

    if (scope.modulo && !adminRoles.includes(scope.rol)) {
      // Filtrar por modulo de la CATEGORIA (no del producto):
      // los productos heredan la visibilidad del modulo de su categoria.
      qb.andWhere('c.modulo = :modulo', { modulo: scope.modulo });
    }

    return qb.getMany();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['categoria'] });
  }

  create(data: Partial<Producto>) {
    const clean: any = { ...data };
    if (clean.categoria_id === '' || clean.categoria_id === null) clean.categoria_id = null;
    if (clean.costo === '' || clean.costo === undefined) delete clean.costo;
    if (clean.imagen_url === '') clean.imagen_url = null;
    delete clean.created_at; delete clean.updated_at;
    return this.repo.save(this.repo.create(clean));
  }

  async update(id: number, data: Partial<Producto>) {
    // Strip auto-managed and immutable fields before update
    const { id: _id, created_at, updated_at, ...rest } = data as any;
    const clean: any = { ...rest };
    if (clean.categoria_id === '' || clean.categoria_id === null) clean.categoria_id = null;
    if (clean.costo === '' || clean.costo === undefined) delete clean.costo;
    if (clean.imagen_url === '') clean.imagen_url = null;
    // Remove relation objects that TypeORM can't update directly
    delete clean.categoria;
    delete clean.tiendas;
    await this.repo.update(id, clean);
    return this.findOne(id);
  }

  getCSVTemplate(): string {
    return 'sku,nombre,descripcion,precio,costo,categoria,unidad,impuesto_pct,codigo_barras,controla_stock,stock_actual,stock_minimo,imagen_url\n'
      + 'PROD001,Hamburguesa Clásica,Carne 150g con lechuga y tomate,89.00,35.00,Hamburguesas,pza,16,7501234567890,false,0,0,\n'
      + 'PROD002,Refresco Cola 600ml,Refresco de cola,25.00,12.00,Bebidas,pza,16,,false,0,0,';
  }

  private decodeCSV(buffer: Buffer): string {
    // UTF-16LE BOM: FF FE (Excel "Unicode Text" / "CSV UTF-16")
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      return buffer.slice(2).toString('utf16le');
    }
    // UTF-16BE BOM: FE FF
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      const swapped = Buffer.alloc(buffer.length - 2);
      for (let i = 2; i < buffer.length; i += 2) {
        swapped[i - 2] = buffer[i + 1];
        swapped[i - 1] = buffer[i];
      }
      return swapped.toString('utf16le');
    }
    let str = buffer.toString('utf-8');
    // UTF-8 BOM: EF BB BF
    if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
    // Si hay caracteres de reemplazo, intentar Latin-1 / Windows-1252
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
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Archivo vacío o no recibido');
    }

    // Detectar si es un archivo binario (xlsx, pdf, etc.) — primeros bytes son firma ZIP/Office
    const magic = buffer.slice(0, 4).toString('hex');
    if (magic === '504b0304') {
      throw new BadRequestException('El archivo parece ser un Excel .xlsx. Exportalo como CSV (.csv) antes de importar');
    }

    let csvStr: string;
    let rawRecords: any[];
    try {
      csvStr = this.decodeCSV(buffer);
      const delimiter = this.detectDelimiter(csvStr);
      this.logger.log(`CSV import: delimiter='${delimiter === '\t' ? 'TAB' : delimiter}', tenant=${scope.tenant_id}, empresa=${scope.empresa_id}, updateExisting=${updateExisting}`);
      const normalizeKey = (k: string) => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
      const rawRecordsRaw = parse(csvStr, { columns: true, skip_empty_lines: true, trim: true, delimiter });
      rawRecords = rawRecordsRaw.map((r: any) => {
        const norm: any = {};
        for (const [k, v] of Object.entries(r)) norm[normalizeKey(k)] = v;
        return norm;
      });
    } catch (e) {
      throw new BadRequestException(`No se pudo leer el archivo CSV: ${e.message}`);
    }

    const records = rawRecords;

    const results = { success: 0, errors: [] as any[], updated: 0, total: records.length, columns: [] as string[], categorias_creadas: 0 };

    if (records.length > 0) {
      results.columns = Object.keys(records[0]);
      this.logger.log(`CSV columns detected: ${results.columns.join(', ')} | rows: ${records.length}`);
    }

    // Pre-load categories for name→id resolution
    const categorias = await this.catRepo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
      order: { orden: 'DESC' },
    });
    const catMap = new Map<string, number>();
    let maxOrden = 0;
    for (const c of categorias) {
      catMap.set(c.nombre.toLowerCase(), c.id);
      if (c.orden > maxOrden) maxOrden = c.orden;
    }

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
            // Auto-crear categoría con orden consecutivo y valores default
            maxOrden += 10;
            const catEntity = new Categoria();
            catEntity.tenant_id = scope.tenant_id;
            catEntity.empresa_id = scope.empresa_id;
            catEntity.nombre = row.categoria;
            catEntity.orden = maxOrden;
            catEntity.activo = true;
            const newCat = await this.catRepo.save(catEntity);
            catMap.set(newCat.nombre.toLowerCase(), newCat.id);
            categoriaId = newCat.id;
            results.categorias_creadas++;
            this.logger.log(`CSV: categoría auto-creada '${row.categoria}' (id=${newCat.id}, orden=${maxOrden})`);
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
          imagen_url: row.imagen_url || null,
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
      const apiKey = process.env.PEXELS_API_KEY;
      if (!apiKey) return [];
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=16&locale=es-MX`;
      const res = await fetch(url, { headers: { Authorization: apiKey } });
      if (!res.ok) return [];
      const json: any = await res.json();
      return (json.photos || []).map((p: any, i: number) => ({
        id: i,
        url: p.src.large || p.src.original,
        thumb: p.src.medium,
        alt: p.alt || query,
      }));
    } catch (err) {
      this.logger.error('Error buscando imagenes en Pexels', err);
      return [];
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const { saveUploadedImage } = await import('../../common/utils/upload-image.util');
    return saveUploadedImage(file, 'producto');
  }

  // ── Generar imagen con IA ──────────────────────────────────────────────────
  // Por defecto (sin configurar nada) el boton "Generar con IA" del frontend usa
  // Pollinations.ai directo desde el navegador (gratis, sin key). Este config/endpoint
  // solo aplica si la empresa quiere mejor calidad y captura su propia key de OpenAI —
  // esa key nunca se manda al navegador, la llamada a OpenAI siempre corre aqui.

  async getIaImagenesConfig(empresa_id: number) {
    const cfg = await this.iaImagenesRepo.findOne({ where: { empresa_id } });
    return {
      provider: cfg?.provider || 'pollinations',
      openai_api_key: cfg?.openai_api_key ? this.maskKey(cfg.openai_api_key) : '',
    };
  }

  async saveIaImagenesConfig(scope: any, data: { provider?: string; openai_api_key?: string }) {
    let cfg = await this.iaImagenesRepo.findOne({ where: { empresa_id: scope.empresa_id } });
    if (!cfg) {
      cfg = this.iaImagenesRepo.create({ empresa_id: scope.empresa_id, tenant_id: scope.tenant_id });
    }
    if (data.provider === 'pollinations' || data.provider === 'openai') cfg.provider = data.provider;
    // Ignora el valor si viene enmascarado (el usuario no lo toco al re-guardar el form)
    if (data.openai_api_key !== undefined && !data.openai_api_key.includes('***')) {
      cfg.openai_api_key = data.openai_api_key || null;
    }
    const saved = await this.iaImagenesRepo.save(cfg);
    return { provider: saved.provider, openai_api_key: saved.openai_api_key ? this.maskKey(saved.openai_api_key) : '' };
  }

  async generateImage(scope: any, prompt: string): Promise<{ image_base64: string }> {
    const cfg = await this.iaImagenesRepo.findOne({ where: { empresa_id: scope.empresa_id } });
    if (!cfg?.provider || cfg.provider !== 'openai' || !cfg.openai_api_key) {
      throw new BadRequestException('Esta empresa no tiene configurada una API key de OpenAI — usa el modo gratis del navegador');
    }
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: `Fotografia de catalogo de producto: ${prompt}. Fondo blanco liso, iluminacion de estudio, un solo producto centrado, sin texto, sin marca de agua.`,
        size: '1024x1024',
        n: 1,
      }),
    });
    const json: any = await res.json();
    if (!res.ok) {
      this.logger.error('Error generando imagen con OpenAI', JSON.stringify(json));
      throw new BadRequestException(json?.error?.message || 'Error al generar la imagen con IA');
    }
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new BadRequestException('OpenAI no devolvio una imagen');
    return { image_base64: b64 };
  }

  private maskKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return key.substring(0, 3) + '***' + key.substring(key.length - 4);
  }
}
