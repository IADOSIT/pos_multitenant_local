import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
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
      // Superadmin tiene tenant_id=null — usar el tenant de la tienda como fallback
      const tenantId  = scope.tenant_id  ?? tienda.tenant_id;
      const empresaId = scope.empresa_id ?? tienda.empresa_id;
      // Default cloud_url = this same backend (self-publish works out of the box)
      const defaultCloudUrl = `http://localhost:${process.env.APP_PORT || 3000}`;
      cfg = this.configRepo.create({
        tenant_id: tenantId,
        empresa_id: empresaId,
        tienda_id: tiendaId,
        slug: this.generateSlug(tienda.nombre),
        api_key: randomBytes(32).toString('hex'),
        is_active: false,
        modo_menu: 'consulta',
        sync_mode: 'manual',
        sync_interval: 30,
        cloud_url: defaultCloudUrl,
      });
      cfg = await this.configRepo.save(cfg);
    }
    return cfg;
  }

  // Returns URLs of this server (backend + frontend) for the UI to suggest
  getServerInfo(): { backendUrl: string; frontendUrl: string } {
    const backendUrl = `http://localhost:${process.env.APP_PORT || 3000}`;
    const frontendUrl = (process.env.FRONTEND_URL || backendUrl).replace(/\/$/, '');
    return { backendUrl, frontendUrl };
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
    const allowed = ['is_active', 'modo_menu', 'sync_mode', 'sync_interval', 'cloud_url', 'slug', 'plantilla'];
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

    // cloud_url es la URL pública del menú (puede ser localhost, IP externa, dominio).
    // Frontend + backend siempre están en el mismo servidor, por lo que el snapshot
    // siempre se guarda directo en la BD local. cloud_url solo define la URL del QR.
    const backendUrl  = `http://localhost:${process.env.APP_PORT || 3000}`;
    const frontendUrl = (process.env.FRONTEND_URL || backendUrl).replace(/\/$/, '');
    const cloudUrl    = (cfg.cloud_url || '').replace(/\/$/, '');

    try {
      const tienda  = await this.tiendaRepo.findOne({ where: { id: tiendaId } });
      if (!tienda) throw new Error('Tienda no encontrada');
      // Superadmin tiene scope.tenant_id=null — usar tenant/empresa de la tienda como fallback
      const tenantId  = scope.tenant_id  ?? tienda.tenant_id;
      const empresaId = scope.empresa_id ?? tienda.empresa_id;
      const empresa = await this.empresaRepo.findOne({ where: { id: empresaId } });

      const categorias = await this.categoriaRepo.find({
        where: { tenant_id: tenantId, empresa_id: empresaId, activo: true },
        order: { orden: 'ASC', nombre: 'ASC' },
      });
      const productos = await this.productoRepo.find({
        where: { tenant_id: tenantId, empresa_id: empresaId, activo: true, disponible: true },
        order: { categoria_id: 'ASC', orden: 'ASC', nombre: 'ASC' },
      });

      const tiendaData = {
        nombre: tienda.nombre, direccion: tienda.direccion || '',
        telefono: tienda.telefono || '', email: tienda.email || '',
        logo_url: empresa?.logo_url || '', empresa_nombre: empresa?.nombre || '',
      };
      const categoriasData = categorias.map(c => ({
        id: c.id, nombre: c.nombre, color: c.color || null, icono: c.icono || null, orden: c.orden,
      }));
      // Las URLs de imagen son relativas (/api/uploads/...) y quedan correctas
      // tanto desde localhost como desde cualquier IP externa, ya que es el mismo servidor.
      const productosData = productos.map(p => ({
        id: p.id, nombre: p.nombre, descripcion: p.descripcion || '', precio: Number(p.precio),
        categoria_id: p.categoria_id, imagen_url: p.imagen_url || null,
        disponible: p.disponible, orden: p.orden,
      }));

      this.logger.log(`Publicando menu "${cfg.slug}" → BD local (${productos.length} productos)`);

      await this.saveSnapshotDirect({
        slug: cfg.slug, tenant_id: cfg.tenant_id, empresa_id: cfg.empresa_id,
        tienda_id: tiendaId, modo_menu: cfg.modo_menu, is_active: cfg.is_active,
        plantilla: cfg.plantilla || 'oscuro',
        tienda_json:      JSON.stringify(tiendaData),
        categorias_json:  JSON.stringify(categoriasData),
        productos_json:   JSON.stringify(productosData),
      });

      cfg.last_published_at  = new Date();
      cfg.last_publish_status = 'success';
      (cfg as any).last_publish_error = null;
      await this.configRepo.save(cfg);

      const duration = Date.now() - start;
      await this.logRepo.save(this.logRepo.create({
        tienda_id: tiendaId, tenant_id: cfg.tenant_id,
        productos_count: productos.length, images_uploaded: 0,
        status: 'success', duration_ms: duration,
      }));

      // URL del menú: usa cloud_url si está configurado (para el QR),
      // si no, usa frontendUrl como fallback.
      const menuUrl = cloudUrl
        ? `${cloudUrl}/menu/${cfg.slug}`
        : `${frontendUrl}/menu/${cfg.slug}`;

      return {
        success: true,
        productos: productos.length,
        duration_ms: duration,
        menu_url: menuUrl,
      };
    } catch (err) {
      cfg.last_publish_status = 'error';
      cfg.last_publish_error  = err.message;
      await this.configRepo.save(cfg);
      await this.logRepo.save(this.logRepo.create({
        tienda_id: tiendaId, tenant_id: cfg.tenant_id,
        productos_count: 0, images_uploaded: 0,
        status: 'error', error_message: err.message, duration_ms: Date.now() - start,
      }));
      throw err;
    }
  }

  // =========================================================================
  // Cloud: Receive (API key protected)
  // =========================================================================

  async receiveSnapshot(dto: any): Promise<{ ok: boolean }> {
    const { api_key, slug, ...data } = dto;

    // Upsert config: LOCAL is authoritative — create if new, sync api_key if exists.
    // This ensures receive-image (called later) can validate against the correct api_key.
    let cfg = await this.configRepo.findOne({ where: { slug } });
    if (!cfg) {
      cfg = this.configRepo.create({
        slug, api_key,
        tenant_id: data.tenant_id, empresa_id: data.empresa_id, tienda_id: data.tienda_id,
        modo_menu: data.modo_menu, is_active: data.is_active,
        sync_mode: 'manual', sync_interval: 30,
      });
    } else {
      cfg.api_key   = api_key;   // sync LOCAL api_key so future image uploads validate
      cfg.modo_menu = data.modo_menu;
      cfg.is_active = data.is_active;
    }
    await this.configRepo.save(cfg);

    let snap = await this.snapshotRepo.findOne({ where: { slug } });
    if (!snap) snap = this.snapshotRepo.create({ slug });

    snap.tenant_id   = data.tenant_id;
    snap.empresa_id  = data.empresa_id;
    snap.tienda_id   = data.tienda_id;
    snap.modo_menu   = data.modo_menu;
    snap.is_active   = data.is_active;
    snap.plantilla   = data.plantilla || 'oscuro';
    snap.tienda_json      = data.tienda_json;
    snap.categorias_json  = data.categorias_json;
    snap.productos_json   = data.productos_json;
    snap.published_at     = new Date();

    await this.snapshotRepo.save(snap);
    return { ok: true };
  }

  async receiveImage(dto: any): Promise<{ url: string }> {
    const { api_key, slug, filename, hash, data: b64data } = dto;

    // Allow upload if slug is new (no config yet); reject only if config exists with wrong api_key.
    const existingCfg = await this.configRepo.findOne({ where: { slug } });
    if (existingCfg && existingCfg.api_key !== api_key) {
      throw new UnauthorizedException('API key inválida');
    }

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
      plantilla: snap.plantilla || 'oscuro',
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

  // Save snapshot directly to local DB
  private async saveSnapshotDirect(data: {
    slug: string; tenant_id: number; empresa_id: number; tienda_id: number;
    modo_menu: string; is_active: boolean; plantilla: string;
    tienda_json: string; categorias_json: string; productos_json: string;
  }): Promise<void> {
    let snap = await this.snapshotRepo.findOne({ where: { slug: data.slug } });
    if (!snap) snap = this.snapshotRepo.create({ slug: data.slug });
    snap.tenant_id       = data.tenant_id;
    snap.empresa_id      = data.empresa_id;
    snap.tienda_id       = data.tienda_id;
    snap.modo_menu       = data.modo_menu;
    snap.is_active       = data.is_active;
    snap.plantilla       = data.plantilla;
    snap.tienda_json     = data.tienda_json;
    snap.categorias_json = data.categorias_json;
    snap.productos_json  = data.productos_json;
    snap.published_at    = new Date();
    await this.snapshotRepo.save(snap);
  }

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
