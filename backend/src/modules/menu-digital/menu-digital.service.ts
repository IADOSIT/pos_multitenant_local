import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { join } from 'path';
import { MenuDigitalConfig } from './entities/menu-digital-config.entity';
import { MenuDigitalSnapshot } from './entities/menu-digital-snapshot.entity';
import { MenuDigitalLog } from './entities/menu-digital-log.entity';
import { MenuDigitalOrder } from './entities/menu-digital-order.entity';
import { Producto } from '../productos/producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { Tienda } from '../tiendas/tienda.entity';
import { Empresa } from '../empresas/empresa.entity';

@Injectable()
export class MenuDigitalService {
  private readonly logger = new Logger('MenuDigitalService');

  constructor(
    @InjectRepository(MenuDigitalConfig)  private configRepo: Repository<MenuDigitalConfig>,
    @InjectRepository(MenuDigitalSnapshot) private snapshotRepo: Repository<MenuDigitalSnapshot>,
    @InjectRepository(MenuDigitalLog)     private logRepo: Repository<MenuDigitalLog>,
    @InjectRepository(MenuDigitalOrder)   private orderRepo: Repository<MenuDigitalOrder>,
    @InjectRepository(Producto)           private productoRepo: Repository<Producto>,
    @InjectRepository(Categoria)          private categoriaRepo: Repository<Categoria>,
    @InjectRepository(Tienda)             private tiendaRepo: Repository<Tienda>,
    @InjectRepository(Empresa)            private empresaRepo: Repository<Empresa>,
  ) {}

  // =========================================================================
  // Config CRUD
  // =========================================================================

  async getOrCreateConfig(tiendaId: number, scope: any): Promise<MenuDigitalConfig> {
    let cfg = await this.configRepo.findOne({ where: { tienda_id: tiendaId } });
    if (!cfg) {
      const tienda = await this.tiendaRepo.findOne({ where: { id: tiendaId } });
      if (!tienda) throw new NotFoundException('Tienda no encontrada');
      cfg = this.configRepo.create({
        tenant_id: scope.tenant_id,
        empresa_id: scope.empresa_id,
        tienda_id: tiendaId,
        slug: this.generateSlug(tienda.nombre),
        api_key: randomBytes(32).toString('hex'),
        is_active: false,
        modo_menu: 'consulta',
        sync_mode: 'manual',
        sync_interval: 30,
      });
      cfg = await this.configRepo.save(cfg);
    }
    return cfg;
  }

  async updateConfig(tiendaId: number, dto: Partial<MenuDigitalConfig>, scope: any): Promise<MenuDigitalConfig> {
    const cfg = await this.getOrCreateConfig(tiendaId, scope);
    // Validate slug uniqueness if changed
    if (dto.slug && dto.slug !== cfg.slug) {
      const existing = await this.configRepo.findOne({ where: { slug: dto.slug } });
      if (existing && existing.tienda_id !== tiendaId) {
        dto.slug = dto.slug + '-' + Date.now().toString(36);
      }
    }
    const allowed = ['is_active', 'modo_menu', 'sync_mode', 'sync_interval', 'cloud_url', 'slug'];
    for (const key of allowed) {
      if (dto[key] !== undefined) (cfg as any)[key] = dto[key];
    }
    return this.configRepo.save(cfg);
  }

  async regenerateApiKey(tiendaId: number, scope: any): Promise<{ api_key: string }> {
    const cfg = await this.getOrCreateConfig(tiendaId, scope);
    cfg.api_key = randomBytes(32).toString('hex');
    await this.configRepo.save(cfg);
    return { api_key: cfg.api_key };
  }

  async getStatus(tiendaId: number, scope: any) {
    const cfg = await this.getOrCreateConfig(tiendaId, scope);
    const pendingChanges = await this.countPendingChanges(tiendaId, cfg, scope);
    const shouldAutoSync = cfg.sync_mode === 'auto' && cfg.is_active && cfg.cloud_url &&
      (!cfg.last_published_at || this.minutesSince(cfg.last_published_at) >= cfg.sync_interval);
    return { config: cfg, pending_changes: pendingChanges, should_auto_sync: shouldAutoSync };
  }

  async getLogs(tiendaId: number): Promise<MenuDigitalLog[]> {
    return this.logRepo.find({
      where: { tienda_id: tiendaId },
      order: { created_at: 'DESC' },
      take: 10,
    });
  }

  // =========================================================================
  // Publish (Local → Cloud)
  // =========================================================================

  async publish(tiendaId: number, scope: any): Promise<any> {
    const start = Date.now();
    const cfg = await this.getOrCreateConfig(tiendaId, scope);

    if (!cfg.cloud_url) {
      throw new Error('No hay URL de servidor cloud configurada');
    }

    try {
      // 1. Gather tienda + empresa data
      const tienda = await this.tiendaRepo.findOne({ where: { id: tiendaId } });
      const empresa = await this.empresaRepo.findOne({ where: { id: scope.empresa_id } });
      if (!tienda) throw new Error('Tienda no encontrada');

      // 2. Resolve tienda logo: use empresa logo
      const tiendaLogoUrl = empresa?.logo_url || null;

      // 3. Get categorias
      const categorias = await this.categoriaRepo.find({
        where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
        order: { orden: 'ASC', nombre: 'ASC' },
      });

      // 4. Get productos activos y disponibles
      const productos = await this.productoRepo.find({
        where: {
          tenant_id: scope.tenant_id,
          empresa_id: scope.empresa_id,
          activo: true,
          disponible: true,
        },
        order: { categoria_id: 'ASC', orden: 'ASC', nombre: 'ASC' },
      });

      // 5. Upload images to cloud
      let imagesUploaded = 0;
      const imageUrlMap: Map<string, string> = new Map();

      for (const prod of productos) {
        if (!prod.imagen_url) continue;
        try {
          const cloudUrl = await this.uploadImageToCloud(prod.imagen_url, cfg.cloud_url, cfg.api_key, cfg.slug);
          if (cloudUrl) {
            imageUrlMap.set(prod.imagen_url, cloudUrl);
            imagesUploaded++;
          }
        } catch (e) {
          this.logger.warn(`No se pudo subir imagen del producto ${prod.id}: ${e.message}`);
        }
      }

      // Upload empresa logo if exists
      let cloudLogoUrl = tiendaLogoUrl;
      if (tiendaLogoUrl && !tiendaLogoUrl.startsWith('http')) {
        try {
          const logoCloud = await this.uploadImageToCloud(tiendaLogoUrl, cfg.cloud_url, cfg.api_key, cfg.slug);
          if (logoCloud) cloudLogoUrl = logoCloud;
        } catch {}
      }

      // 6. Build snapshot payload
      const tiendaData = {
        nombre: tienda.nombre,
        direccion: tienda.direccion || '',
        telefono: tienda.telefono || '',
        email: tienda.email || '',
        logo_url: cloudLogoUrl || '',
        empresa_nombre: empresa?.nombre || '',
      };

      const categoriasData = categorias.map(c => ({
        id: c.id,
        nombre: c.nombre,
        color: c.color || null,
        icono: c.icono || null,
        orden: c.orden,
      }));

      const productosData = productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion || '',
        precio: Number(p.precio),
        categoria_id: p.categoria_id,
        imagen_url: imageUrlMap.get(p.imagen_url) || null,
        disponible: p.disponible,
        orden: p.orden,
      }));

      // 7. Send snapshot to cloud
      const payload = {
        api_key: cfg.api_key,
        slug: cfg.slug,
        tenant_id: cfg.tenant_id,
        empresa_id: cfg.empresa_id,
        tienda_id: tiendaId,
        modo_menu: cfg.modo_menu,
        is_active: cfg.is_active,
        tienda_json: JSON.stringify(tiendaData),
        categorias_json: JSON.stringify(categoriasData),
        productos_json: JSON.stringify(productosData),
      };

      const response = await fetch(`${cfg.cloud_url}/api/menu-digital/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cloud respondio ${response.status}: ${errText}`);
      }

      // 8. Update config
      cfg.last_published_at = new Date();
      cfg.last_publish_status = 'success';
      cfg.last_publish_error = null;
      await this.configRepo.save(cfg);

      // 9. Save log
      const duration = Date.now() - start;
      await this.logRepo.save(this.logRepo.create({
        tienda_id: tiendaId,
        tenant_id: scope.tenant_id,
        productos_count: productos.length,
        images_uploaded: imagesUploaded,
        status: 'success',
        duration_ms: duration,
      }));

      return {
        success: true,
        productos: productos.length,
        images_uploaded: imagesUploaded,
        duration_ms: duration,
        menu_url: `${cfg.cloud_url}/menu/${cfg.slug}`,
      };
    } catch (err) {
      // Save error
      cfg.last_publish_status = 'error';
      cfg.last_publish_error = err.message;
      await this.configRepo.save(cfg);

      await this.logRepo.save(this.logRepo.create({
        tienda_id: tiendaId,
        tenant_id: scope.tenant_id,
        productos_count: 0,
        images_uploaded: 0,
        status: 'error',
        error_message: err.message,
        duration_ms: Date.now() - start,
      }));

      throw err;
    }
  }

  // =========================================================================
  // Cloud: Receive (API key protected)
  // =========================================================================

  async receiveSnapshot(dto: any): Promise<{ ok: boolean }> {
    const { api_key, slug, ...data } = dto;
    await this.validateApiKey(api_key, slug);

    let snap = await this.snapshotRepo.findOne({ where: { slug } });
    if (!snap) snap = this.snapshotRepo.create({ slug });

    snap.tenant_id   = data.tenant_id;
    snap.empresa_id  = data.empresa_id;
    snap.tienda_id   = data.tienda_id;
    snap.modo_menu   = data.modo_menu;
    snap.is_active   = data.is_active;
    snap.tienda_json      = data.tienda_json;
    snap.categorias_json  = data.categorias_json;
    snap.productos_json   = data.productos_json;
    snap.published_at     = new Date();

    await this.snapshotRepo.save(snap);
    return { ok: true };
  }

  async receiveImage(dto: any): Promise<{ url: string }> {
    const { api_key, slug, filename, hash, data: b64data } = dto;
    await this.validateApiKey(api_key, slug);

    const fs = await import('fs/promises');
    const path = await import('path');

    const ext = path.extname(filename) || '.jpg';
    const destName = `menu-${hash}${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'menu');
    const destPath  = path.join(uploadDir, destName);

    // Check if already exists (content-addressed by hash)
    try {
      await fs.access(destPath);
      return { url: `/api/uploads/menu/${destName}` };
    } catch {
      // File doesn't exist, save it
    }

    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(b64data, 'base64');
    await fs.writeFile(destPath, buffer);

    return { url: `/api/uploads/menu/${destName}` };
  }

  // =========================================================================
  // Public Menu (no auth)
  // =========================================================================

  async getPublicMenu(slug: string) {
    const snap = await this.snapshotRepo.findOne({ where: { slug, is_active: true } });
    if (!snap) throw new NotFoundException('Menu no encontrado o inactivo');

    return {
      slug: snap.slug,
      modo_menu: snap.modo_menu,
      tienda: JSON.parse(snap.tienda_json || '{}'),
      categorias: JSON.parse(snap.categorias_json || '[]'),
      productos: JSON.parse(snap.productos_json || '[]'),
      published_at: snap.published_at,
    };
  }

  // =========================================================================
  // Orders (public menu → POS)
  // =========================================================================

  async createOrder(slug: string, dto: any): Promise<MenuDigitalOrder> {
    const snap = await this.snapshotRepo.findOne({ where: { slug, is_active: true } });
    if (!snap) throw new NotFoundException('Menu no disponible');
    if (snap.modo_menu !== 'pedidos') throw new Error('Esta tienda no acepta pedidos por menu digital');

    // Generate sequential order number (per day)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.orderRepo.count({ where: { tienda_id: snap.tienda_id } });
    const numero_orden = String(count + 1).padStart(3, '0');

    const order = this.orderRepo.create({
      slug,
      tienda_id: snap.tienda_id,
      tenant_id: snap.tenant_id,
      numero_orden,
      cliente_nombre: dto.cliente_nombre || null,
      mesa_numero: dto.mesa_numero || null,
      items: dto.items,
      total: dto.total,
      notas: dto.notas || null,
      status: 'pending',
    });

    return this.orderRepo.save(order);
  }

  async getPendingOrders(tiendaId: number, apiKey: string): Promise<MenuDigitalOrder[]> {
    const cfg = await this.configRepo.findOne({ where: { tienda_id: tiendaId } });
    if (!cfg || cfg.api_key !== apiKey) throw new UnauthorizedException();
    return this.orderRepo.find({
      where: { tienda_id: tiendaId, status: 'pending' },
      order: { created_at: 'ASC' },
    });
  }

  async updateOrderStatus(orderId: number, status: string, tiendaId: number): Promise<MenuDigitalOrder> {
    const order = await this.orderRepo.findOne({ where: { id: orderId, tienda_id: tiendaId } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    order.status = status;
    return this.orderRepo.save(order);
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `${base}-${Date.now().toString(36)}`;
  }

  private async uploadImageToCloud(
    imagenUrl: string,
    cloudUrl: string,
    apiKey: string,
    slug: string,
  ): Promise<string | null> {
    if (!imagenUrl) return null;

    const fs = await import('fs/promises');
    const path = await import('path');

    // Extract filename from URL like /api/uploads/filename.jpg or /api/uploads/menu/file.jpg
    const parts = imagenUrl.split('/uploads/');
    if (parts.length < 2) return null;
    const relativePath = parts[1]; // e.g. "filename.jpg" or "menu/file.jpg"
    const filePath = path.join(process.cwd(), 'uploads', relativePath);

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      this.logger.warn(`Imagen no encontrada en disco: ${filePath}`);
      return null;
    }

    const hash = createHash('md5').update(buffer).digest('hex');
    const filename = path.basename(relativePath);
    const b64 = buffer.toString('base64');

    const res = await fetch(`${cloudUrl}/api/menu-digital/receive-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, slug, filename, hash, data: b64 }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const result: any = await res.json();

    // If cloud_url is external, return full URL; if local, return relative
    const url: string = result.url;
    if (url.startsWith('/')) {
      return `${cloudUrl}${url}`;
    }
    return url;
  }

  private async countPendingChanges(tiendaId: number, cfg: MenuDigitalConfig, scope: any): Promise<number> {
    if (!cfg.last_published_at) return -1; // never published
    const since = cfg.last_published_at;

    const prodChanges = await this.productoRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tid AND p.empresa_id = :eid AND p.updated_at > :since', {
        tid: scope.tenant_id,
        eid: scope.empresa_id,
        since,
      })
      .getCount();

    const catChanges = await this.categoriaRepo
      .createQueryBuilder('c')
      .where('c.tenant_id = :tid AND c.empresa_id = :eid AND c.updated_at > :since', {
        tid: scope.tenant_id,
        eid: scope.empresa_id,
        since,
      })
      .getCount();

    return prodChanges + catChanges;
  }

  private async validateApiKey(apiKey: string, slug: string): Promise<void> {
    const cfg = await this.configRepo.findOne({ where: { slug, api_key: apiKey } });
    if (!cfg) throw new UnauthorizedException('API key invalida');
  }

  private minutesSince(date: Date): number {
    return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  }
}
