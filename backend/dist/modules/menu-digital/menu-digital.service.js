"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuDigitalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const menu_digital_config_entity_1 = require("./entities/menu-digital-config.entity");
const menu_digital_snapshot_entity_1 = require("./entities/menu-digital-snapshot.entity");
const menu_digital_log_entity_1 = require("./entities/menu-digital-log.entity");
const menu_digital_order_entity_1 = require("./entities/menu-digital-order.entity");
const producto_entity_1 = require("../productos/producto.entity");
const categoria_entity_1 = require("../categorias/categoria.entity");
const tienda_entity_1 = require("../tiendas/tienda.entity");
const empresa_entity_1 = require("../empresas/empresa.entity");
let MenuDigitalService = class MenuDigitalService {
    constructor(configRepo, snapshotRepo, logRepo, orderRepo, productoRepo, categoriaRepo, tiendaRepo, empresaRepo) {
        this.configRepo = configRepo;
        this.snapshotRepo = snapshotRepo;
        this.logRepo = logRepo;
        this.orderRepo = orderRepo;
        this.productoRepo = productoRepo;
        this.categoriaRepo = categoriaRepo;
        this.tiendaRepo = tiendaRepo;
        this.empresaRepo = empresaRepo;
        this.logger = new common_1.Logger('MenuDigitalService');
    }
    async getOrCreateConfig(tiendaId, scope) {
        let cfg = await this.configRepo.findOne({ where: { tienda_id: tiendaId } });
        if (!cfg) {
            const tienda = await this.tiendaRepo.findOne({ where: { id: tiendaId } });
            if (!tienda)
                throw new common_1.NotFoundException('Tienda no encontrada');
            const tenantId = scope.tenant_id ?? tienda.tenant_id;
            const empresaId = scope.empresa_id ?? tienda.empresa_id;
            const defaultCloudUrl = `http://localhost:${process.env.APP_PORT || 3000}`;
            cfg = this.configRepo.create({
                tenant_id: tenantId,
                empresa_id: empresaId,
                tienda_id: tiendaId,
                slug: this.generateSlug(tienda.nombre),
                api_key: (0, crypto_1.randomBytes)(32).toString('hex'),
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
    getServerInfo() {
        const backendUrl = `http://localhost:${process.env.APP_PORT || 3000}`;
        const frontendUrl = (process.env.FRONTEND_URL || backendUrl).replace(/\/$/, '');
        return { backendUrl, frontendUrl };
    }
    async updateConfig(tiendaId, dto, scope) {
        const cfg = await this.getOrCreateConfig(tiendaId, scope);
        if (dto.slug && dto.slug !== cfg.slug) {
            const existing = await this.configRepo.findOne({ where: { slug: dto.slug } });
            if (existing && existing.tienda_id !== tiendaId) {
                dto.slug = dto.slug + '-' + Date.now().toString(36);
            }
        }
        const allowed = ['is_active', 'modo_menu', 'sync_mode', 'sync_interval', 'cloud_url', 'worker_url', 'slug', 'plantilla'];
        for (const key of allowed) {
            if (dto[key] !== undefined)
                cfg[key] = dto[key];
        }
        return this.configRepo.save(cfg);
    }
    async regenerateApiKey(tiendaId, scope) {
        const cfg = await this.getOrCreateConfig(tiendaId, scope);
        cfg.api_key = (0, crypto_1.randomBytes)(32).toString('hex');
        await this.configRepo.save(cfg);
        return { api_key: cfg.api_key };
    }
    async getStatus(tiendaId, scope) {
        const cfg = await this.getOrCreateConfig(tiendaId, scope);
        const pendingChanges = await this.countPendingChanges(tiendaId, cfg, scope);
        const shouldAutoSync = cfg.sync_mode === 'auto' && cfg.is_active && cfg.cloud_url &&
            (!cfg.last_published_at || this.minutesSince(cfg.last_published_at) >= cfg.sync_interval);
        return { config: cfg, pending_changes: pendingChanges, should_auto_sync: shouldAutoSync };
    }
    async getLogs(tiendaId) {
        return this.logRepo.find({
            where: { tienda_id: tiendaId },
            order: { created_at: 'DESC' },
            take: 10,
        });
    }
    async publish(tiendaId, scope) {
        const start = Date.now();
        const cfg = await this.getOrCreateConfig(tiendaId, scope);
        const backendUrl = `http://localhost:${process.env.APP_PORT || 3000}`;
        const frontendUrl = (process.env.FRONTEND_URL || backendUrl).replace(/\/$/, '');
        const cloudUrl = (cfg.cloud_url || '').replace(/\/$/, '');
        try {
            const tienda = await this.tiendaRepo.findOne({ where: { id: tiendaId } });
            if (!tienda)
                throw new Error('Tienda no encontrada');
            const tenantId = scope.tenant_id ?? tienda.tenant_id;
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
            const productosData = productos.map(p => ({
                id: p.id, nombre: p.nombre, descripcion: p.descripcion || '', precio: Number(p.precio),
                categoria_id: p.categoria_id, imagen_url: p.imagen_url || null,
                disponible: p.disponible, orden: p.orden, sku: p.sku || null,
            }));
            this.logger.log(`Publicando menu "${cfg.slug}" → BD local (${productos.length} productos)`);
            let worker_synced = false;
            if (cfg.worker_url && cfg.slug) {
                try {
                    await this.syncToWorker(cfg, tiendaData, categoriasData, productosData);
                    worker_synced = true;
                }
                catch (we) {
                    this.logger.warn(`Worker sync failed (no es crítico): ${we.message}`);
                }
            }
            await this.saveSnapshotDirect({
                slug: cfg.slug, tenant_id: cfg.tenant_id, empresa_id: cfg.empresa_id,
                tienda_id: tiendaId, modo_menu: cfg.modo_menu, is_active: cfg.is_active,
                plantilla: cfg.plantilla || 'oscuro',
                tienda_json: JSON.stringify(tiendaData),
                categorias_json: JSON.stringify(categoriasData),
                productos_json: JSON.stringify(productosData),
            });
            cfg.last_published_at = new Date();
            cfg.last_publish_status = 'success';
            cfg.last_publish_error = null;
            await this.configRepo.save(cfg);
            const duration = Date.now() - start;
            await this.logRepo.save(this.logRepo.create({
                tienda_id: tiendaId, tenant_id: cfg.tenant_id,
                productos_count: productos.length, images_uploaded: 0,
                status: 'success', duration_ms: duration,
            }));
            const menuUrl = cloudUrl
                ? `${cloudUrl}/menu/${cfg.slug}`
                : `${frontendUrl}/menu/${cfg.slug}`;
            return {
                success: true,
                productos: productos.length,
                duration_ms: duration,
                menu_url: menuUrl,
                worker_synced,
            };
        }
        catch (err) {
            cfg.last_publish_status = 'error';
            cfg.last_publish_error = err.message;
            await this.configRepo.save(cfg);
            await this.logRepo.save(this.logRepo.create({
                tienda_id: tiendaId, tenant_id: cfg.tenant_id,
                productos_count: 0, images_uploaded: 0,
                status: 'error', error_message: err.message, duration_ms: Date.now() - start,
            }));
            throw err;
        }
    }
    async receiveSnapshot(dto) {
        const { api_key, slug, ...data } = dto;
        let cfg = await this.configRepo.findOne({ where: { slug } });
        if (!cfg) {
            cfg = this.configRepo.create({
                slug, api_key,
                tenant_id: data.tenant_id, empresa_id: data.empresa_id, tienda_id: data.tienda_id,
                modo_menu: data.modo_menu, is_active: data.is_active,
                sync_mode: 'manual', sync_interval: 30,
            });
        }
        else {
            cfg.api_key = api_key;
            cfg.modo_menu = data.modo_menu;
            cfg.is_active = data.is_active;
        }
        await this.configRepo.save(cfg);
        let snap = await this.snapshotRepo.findOne({ where: { slug } });
        if (!snap)
            snap = this.snapshotRepo.create({ slug });
        snap.tenant_id = data.tenant_id;
        snap.empresa_id = data.empresa_id;
        snap.tienda_id = data.tienda_id;
        snap.modo_menu = data.modo_menu;
        snap.is_active = data.is_active;
        snap.plantilla = data.plantilla || 'oscuro';
        snap.tienda_json = data.tienda_json;
        snap.categorias_json = data.categorias_json;
        snap.productos_json = data.productos_json;
        snap.published_at = new Date();
        await this.snapshotRepo.save(snap);
        return { ok: true };
    }
    async receiveImage(dto) {
        const { api_key, slug, filename, hash, data: b64data } = dto;
        const existingCfg = await this.configRepo.findOne({ where: { slug } });
        if (existingCfg && existingCfg.api_key !== api_key) {
            throw new common_1.UnauthorizedException('API key inválida');
        }
        const fs = await Promise.resolve().then(() => require('fs/promises'));
        const path = await Promise.resolve().then(() => require('path'));
        const ext = path.extname(filename) || '.jpg';
        const destName = `menu-${hash}${ext}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'menu');
        const destPath = path.join(uploadDir, destName);
        try {
            await fs.access(destPath);
            return { url: `/api/uploads/menu/${destName}` };
        }
        catch {
        }
        await fs.mkdir(uploadDir, { recursive: true });
        const buffer = Buffer.from(b64data, 'base64');
        await fs.writeFile(destPath, buffer);
        return { url: `/api/uploads/menu/${destName}` };
    }
    async getPublicMenu(slug) {
        const snap = await this.snapshotRepo.findOne({ where: { slug, is_active: true } });
        if (!snap)
            throw new common_1.NotFoundException('Menu no encontrado o inactivo');
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
    async createOrder(slug, dto) {
        const snap = await this.snapshotRepo.findOne({ where: { slug, is_active: true } });
        if (!snap)
            throw new common_1.NotFoundException('Menu no disponible');
        if (snap.modo_menu !== 'pedidos')
            throw new Error('Esta tienda no acepta pedidos por menu digital');
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
    async getPendingOrders(tiendaId, apiKey) {
        const cfg = await this.configRepo.findOne({ where: { tienda_id: tiendaId } });
        if (!cfg || cfg.api_key !== apiKey)
            throw new common_1.UnauthorizedException();
        return this.orderRepo.find({
            where: { tienda_id: tiendaId, status: 'pending' },
            order: { created_at: 'ASC' },
        });
    }
    async updateOrderStatus(orderId, status, tiendaId) {
        const order = await this.orderRepo.findOne({ where: { id: orderId, tienda_id: tiendaId } });
        if (!order)
            throw new common_1.NotFoundException('Orden no encontrada');
        order.status = status;
        return this.orderRepo.save(order);
    }
    async syncToWorker(cfg, tienda, categorias, productos) {
        const url = cfg.worker_url.replace(/\/$/, '') + '/sync/' + cfg.slug;
        const base = (cfg.cloud_url || '').replace(/\/$/, '');
        const toAbs = (u) => {
            if (!u)
                return null;
            if (u.startsWith('http://') || u.startsWith('https://'))
                return u;
            return base ? base + u : null;
        };
        const productosAbs = productos.map(p => ({
            ...p,
            imagen_url: toAbs(p.imagen_url),
        }));
        const body = {
            api_key: cfg.api_key,
            slug: cfg.slug,
            is_active: cfg.is_active,
            modo_menu: cfg.modo_menu,
            plantilla: cfg.plantilla || 'oscuro',
            tienda: { ...tienda, logo_url: toAbs(tienda.logo_url) },
            categorias,
            productos: productosAbs,
        };
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Worker sync failed (${res.status}): ${text}`);
        }
        this.logger.log(`Worker sync OK → ${url}`);
    }
    async saveSnapshotDirect(data) {
        let snap = await this.snapshotRepo.findOne({ where: { slug: data.slug } });
        if (!snap)
            snap = this.snapshotRepo.create({ slug: data.slug });
        snap.tenant_id = data.tenant_id;
        snap.empresa_id = data.empresa_id;
        snap.tienda_id = data.tienda_id;
        snap.modo_menu = data.modo_menu;
        snap.is_active = data.is_active;
        snap.plantilla = data.plantilla;
        snap.tienda_json = data.tienda_json;
        snap.categorias_json = data.categorias_json;
        snap.productos_json = data.productos_json;
        snap.published_at = new Date();
        await this.snapshotRepo.save(snap);
    }
    generateSlug(name) {
        const base = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '-');
        return `${base}-${Date.now().toString(36)}`;
    }
    async countPendingChanges(tiendaId, cfg, scope) {
        if (!cfg.last_published_at)
            return -1;
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
    async validateApiKey(apiKey, slug) {
        const cfg = await this.configRepo.findOne({ where: { slug, api_key: apiKey } });
        if (!cfg)
            throw new common_1.UnauthorizedException('API key invalida');
    }
    minutesSince(date) {
        return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    }
};
exports.MenuDigitalService = MenuDigitalService;
exports.MenuDigitalService = MenuDigitalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(menu_digital_config_entity_1.MenuDigitalConfig)),
    __param(1, (0, typeorm_1.InjectRepository)(menu_digital_snapshot_entity_1.MenuDigitalSnapshot)),
    __param(2, (0, typeorm_1.InjectRepository)(menu_digital_log_entity_1.MenuDigitalLog)),
    __param(3, (0, typeorm_1.InjectRepository)(menu_digital_order_entity_1.MenuDigitalOrder)),
    __param(4, (0, typeorm_1.InjectRepository)(producto_entity_1.Producto)),
    __param(5, (0, typeorm_1.InjectRepository)(categoria_entity_1.Categoria)),
    __param(6, (0, typeorm_1.InjectRepository)(tienda_entity_1.Tienda)),
    __param(7, (0, typeorm_1.InjectRepository)(empresa_entity_1.Empresa)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MenuDigitalService);
//# sourceMappingURL=menu-digital.service.js.map