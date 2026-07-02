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
exports.EcommerceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ecommerce_config_entity_1 = require("./ecommerce-config.entity");
const ecommerce_pedido_entity_1 = require("./ecommerce-pedido.entity");
const ecommerce_producto_config_entity_1 = require("./ecommerce-producto-config.entity");
const campos_formulario_helper_1 = require("../empresas/campos-formulario.helper");
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 63);
}
let EcommerceService = class EcommerceService {
    constructor(configRepo, pedidoRepo, productoConfigRepo) {
        this.configRepo = configRepo;
        this.pedidoRepo = pedidoRepo;
        this.productoConfigRepo = productoConfigRepo;
    }
    async getConfig(scope) {
        return this.configRepo.findOne({ where: { empresa_id: scope.empresa_id } });
    }
    async upsertConfig(scope, data) {
        let config = await this.configRepo.findOne({ where: { empresa_id: scope.empresa_id } });
        if (!config) {
            config = this.configRepo.create({
                empresa_id: scope.empresa_id,
                tenant_id: scope.tenant_id,
            });
        }
        if (data.subdominio && data.subdominio !== config.subdominio) {
            const exists = await this.configRepo.findOne({ where: { subdominio: data.subdominio } });
            if (exists && exists.empresa_id !== scope.empresa_id) {
                throw new common_1.BadRequestException('Subdominio no disponible');
            }
        }
        if (!data.subdominio && data.activo && !config.subdominio) {
            data.subdominio = await this.generarSubdominioUnico('mi-tienda');
        }
        Object.assign(config, data);
        return this.configRepo.save(config);
    }
    async verificarSubdominio(subdominio, empresaId) {
        const slug = slugify(subdominio);
        const exists = await this.configRepo.findOne({ where: { subdominio: slug } });
        return { disponible: !exists || exists.empresa_id === empresaId };
    }
    async generarSubdominioUnico(nombre) {
        let base = slugify(nombre);
        if (!base)
            base = 'mi-tienda';
        let candidate = base;
        let counter = 2;
        while (await this.configRepo.findOne({ where: { subdominio: candidate } })) {
            candidate = `${base}-${counter++}`;
        }
        return candidate;
    }
    getTemas() {
        return [
            { id: 'lumina', nombre: 'Lumina', descripcion: 'Diseño limpio y corporativo en blanco y azul', modo: 'light', colorPrimary: '#1e40af', colorBg: '#f8fafc' },
            { id: 'obsidian', nombre: 'Obsidian', descripcion: 'Diseño oscuro y premium con acento dorado', modo: 'dark', colorPrimary: '#f59e0b', colorBg: '#0a0a0a' },
            { id: 'zest', nombre: 'Zest', descripcion: 'Diseño vibrante y accesible en naranja cálido', modo: 'light', colorPrimary: '#f97316', colorBg: '#fffbf5' },
        ];
    }
    async getProductoConfig(productoId) {
        return this.productoConfigRepo.findOne({ where: { producto_id: productoId } });
    }
    async upsertProductoConfig(scope, productoId, data) {
        let pc = await this.productoConfigRepo.findOne({ where: { producto_id: productoId } });
        if (!pc) {
            pc = this.productoConfigRepo.create({
                producto_id: productoId,
                tenant_id: scope.tenant_id,
                empresa_id: scope.empresa_id,
            });
        }
        Object.assign(pc, data);
        return this.productoConfigRepo.save(pc);
    }
    async bulkVisibilidad(scope, ids, visible) {
        for (const id of ids) {
            await this.upsertProductoConfig(scope, id, { visible_ecommerce: visible });
        }
    }
    async listPedidos(scope, query) {
        const { page = 1, limit = 20, estado, tipo_venta, fecha_desde, fecha_hasta, buscar } = query;
        const qb = this.pedidoRepo.createQueryBuilder('p')
            .where('p.empresa_id = :eid', { eid: scope.empresa_id })
            .orderBy('p.created_at', 'DESC');
        if (estado)
            qb.andWhere('p.estado = :estado', { estado });
        if (tipo_venta)
            qb.andWhere('p.tipo_venta = :tv', { tv: tipo_venta });
        if (fecha_desde)
            qb.andWhere('p.created_at >= :fd', { fd: new Date(fecha_desde) });
        if (fecha_hasta)
            qb.andWhere('p.created_at <= :fh', { fh: new Date(fecha_hasta) });
        if (buscar)
            qb.andWhere('(p.numero_pedido LIKE :b OR p.cliente_nombre LIKE :b OR p.cliente_email LIKE :b)', { b: `%${buscar}%` });
        const total = await qb.getCount();
        const data = await qb.skip((page - 1) * limit).take(limit).getMany();
        return { data, meta: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) } };
    }
    async getPedido(scope, id) {
        const p = await this.pedidoRepo.findOne({ where: { id, empresa_id: scope.empresa_id } });
        if (!p)
            throw new common_1.NotFoundException('Pedido no encontrado');
        return p;
    }
    async updateEstadoPedido(scope, id, estado, notas_internas) {
        const p = await this.getPedido(scope, id);
        p.estado = estado;
        if (notas_internas !== undefined)
            p.notas_internas = notas_internas;
        return this.pedidoRepo.save(p);
    }
    async deletePedido(scope, id) {
        const p = await this.getPedido(scope, id);
        if (p.estado !== 'pendiente')
            throw new common_1.BadRequestException('Solo se pueden eliminar pedidos pendientes');
        await this.pedidoRepo.remove(p);
        return { ok: true };
    }
    async getConfigBySubdominio(subdominio) {
        const config = await this.configRepo.findOne({ where: { subdominio, activo: true } });
        if (!config)
            throw new common_1.NotFoundException('Tienda no disponible');
        return config;
    }
    async getPublicInfo(subdominio, dataSource) {
        const config = await this.getConfigBySubdominio(subdominio);
        const [empresa] = await dataSource.query('SELECT nombre, telefono, email, direccion, logo_url, config_especial FROM empresas WHERE id = ?', [config.empresa_id]);
        const campos_formulario = (0, campos_formulario_helper_1.resolveCamposFormulario)(empresa?.config_especial);
        return {
            nombre_tienda: config.nombre_tienda || empresa?.nombre,
            descripcion: config.descripcion,
            logo_url: empresa?.logo_url || null,
            banner_url: config.banner_url,
            color_primario: config.color_primario,
            color_secundario: config.color_secundario,
            modo_mayoreo: config.modo_mayoreo,
            qty_min_mayoreo: config.qty_min_mayoreo,
            mensaje_mayoreo: config.mensaje_mayoreo,
            politica_envio: config.politica_envio,
            terminos: config.terminos,
            tema_id: config.tema_id,
            empresa: empresa ? { nombre: empresa.nombre, telefono: empresa.telefono, email: empresa.email, direccion: empresa.direccion, logo_url: empresa.logo_url } : null,
            campos_formulario,
        };
    }
    async getPublicCategorias(subdominio, dataSource) {
        const config = await this.getConfigBySubdominio(subdominio);
        const rows = await dataSource.query(`SELECT c.id, c.nombre, c.imagen_url,
        COUNT(p.id) as total_productos
       FROM categorias c
       INNER JOIN productos p ON p.categoria_id = c.id AND p.empresa_id = ? AND p.activo = 1 AND p.disponible = 1
       LEFT JOIN ecommerce_producto_config ep ON ep.producto_id = p.id
       WHERE c.empresa_id = ? AND c.activo = 1
         AND (ep.visible_ecommerce IS NULL OR ep.visible_ecommerce = 1)
         AND (p.controla_stock = 0 OR p.stock_actual > 0)
       GROUP BY c.id, c.nombre, c.imagen_url
       HAVING total_productos > 0
       ORDER BY c.orden ASC`, [config.empresa_id, config.empresa_id]);
        return rows;
    }
    async getPublicProductos(subdominio, dataSource, query) {
        const config = await this.getConfigBySubdominio(subdominio);
        const { categoria_id, buscar, etiqueta, ordenar = 'nombre', page = 1, limit = 24, con_stock = 'true' } = query;
        let sql = `
      SELECT p.id, p.nombre, p.descripcion, p.sku, p.precio as precio_venta, p.imagen_url,
             p.controla_stock, p.stock_actual as stock, p.categoria_id,
             c.nombre as categoria_nombre,
             COALESCE(ep.precio_mayoreo, NULL) as precio_mayoreo,
             COALESCE(ep.qty_min_mayoreo, NULL) as qty_min_mayoreo,
             COALESCE(ep.visible_ecommerce, 1) as visible_ecommerce,
             ep.descripcion_larga, ep.imagenes_extra, ep.slug,
             ep.etiquetas, COALESCE(ep.orden_ecommerce, 0) as orden_ecommerce
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN ecommerce_producto_config ep ON ep.producto_id = p.id
      WHERE p.empresa_id = ? AND p.activo = 1 AND p.disponible = 1
        AND COALESCE(ep.visible_ecommerce, 1) = 1
    `;
        const params = [config.empresa_id];
        if (con_stock === 'true') {
            sql += ' AND (p.controla_stock = 0 OR p.stock_actual > 0)';
        }
        if (categoria_id) {
            sql += ' AND p.categoria_id = ?';
            params.push(categoria_id);
        }
        if (buscar) {
            sql += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)';
            params.push(`%${buscar}%`, `%${buscar}%`);
        }
        const orderMap = {
            precio_asc: 'p.precio ASC',
            precio_desc: 'p.precio DESC',
            nombre: 'p.nombre ASC',
            novedad: 'p.created_at DESC',
            orden: 'orden_ecommerce ASC',
        };
        sql += ` ORDER BY ${orderMap[ordenar] || 'p.nombre ASC'}`;
        const countSql = `SELECT COUNT(*) as total FROM (${sql}) as sub`;
        const [{ total }] = await dataSource.query(countSql, params);
        const offset = (page - 1) * limit;
        sql += ` LIMIT ? OFFSET ?`;
        params.push(+limit, +offset);
        const rows = await dataSource.query(sql, params);
        const mostrarPrecios = await this.mostrarPreciosParaEmpresa(config.empresa_id, dataSource);
        const data = rows.map((r) => ({
            ...r,
            precio_venta: mostrarPrecios ? r.precio_venta : null,
            precio_mayoreo: mostrarPrecios ? r.precio_mayoreo : null,
            imagenes: [r.imagen_url, ...(r.imagenes_extra ? JSON.parse(r.imagenes_extra) : [])].filter(Boolean),
            etiquetas: r.etiquetas ? JSON.parse(r.etiquetas) : [],
            categoria: { id: r.categoria_id, nombre: r.categoria_nombre },
        }));
        return { data, meta: { total: +total, page: +page, limit: +limit, pages: Math.ceil(total / limit) } };
    }
    async mostrarPreciosParaEmpresa(empresa_id, dataSource) {
        const rows = await dataSource.query('SELECT config_especial FROM empresas WHERE id = ? LIMIT 1', [empresa_id]);
        const cfgRaw = rows[0]?.config_especial;
        const cfg = (typeof cfgRaw === 'string' ? JSON.parse(cfgRaw) : cfgRaw) || {};
        return cfg.mostrar_precios !== false;
    }
    async getPublicProductoBySlug(subdominio, slug, dataSource) {
        const config = await this.getConfigBySubdominio(subdominio);
        const [row] = await dataSource.query(`SELECT p.id, p.nombre, p.descripcion, p.sku,
              p.precio as precio_venta, p.imagen_url,
              p.controla_stock, p.stock_actual as stock,
              p.categoria_id,
              ep.precio_mayoreo, ep.qty_min_mayoreo, ep.descripcion_larga,
              ep.imagenes_extra, ep.slug, ep.etiquetas, ep.visible_ecommerce,
              c.nombre as categoria_nombre
       FROM productos p
       LEFT JOIN ecommerce_producto_config ep ON ep.producto_id = p.id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE (ep.slug = ? OR p.id = ?) AND p.empresa_id = ? AND p.activo = 1`, [slug, slug, config.empresa_id]);
        if (!row)
            throw new common_1.NotFoundException('Producto no encontrado');
        const relacionados = await dataSource.query(`SELECT p.id, p.nombre, p.precio, p.imagen_url, ep.slug
       FROM productos p
       LEFT JOIN ecommerce_producto_config ep ON ep.producto_id = p.id
       WHERE p.categoria_id = ? AND p.empresa_id = ? AND p.id != ? AND p.activo = 1
         AND COALESCE(ep.visible_ecommerce, 1) = 1
       LIMIT 4`, [row.categoria_id, config.empresa_id, row.id]);
        const mostrarPrecios = await this.mostrarPreciosParaEmpresa(config.empresa_id, dataSource);
        return {
            ...row,
            precio_venta: mostrarPrecios ? row.precio_venta : null,
            precio_mayoreo: mostrarPrecios ? row.precio_mayoreo : null,
            imagenes: [row.imagen_url, ...(row.imagenes_extra ? JSON.parse(row.imagenes_extra) : [])].filter(Boolean),
            etiquetas: row.etiquetas ? JSON.parse(row.etiquetas) : [],
            categoria: { id: row.categoria_id, nombre: row.categoria_nombre },
            relacionados: relacionados.map((r) => ({ ...r, precio: mostrarPrecios ? r.precio : null })),
        };
    }
    async crearPedidoPublico(subdominio, body, dataSource) {
        const config = await this.getConfigBySubdominio(subdominio);
        const cliente_nombre = body.cliente_nombre || body.cliente?.nombre;
        const cliente_email = body.cliente_email || body.cliente?.email;
        const cliente_tel = body.cliente_tel || body.cliente?.tel;
        const cliente_empresa = body.cliente_empresa;
        const { direccion_envio, items: itemsInput, notas_cliente } = body;
        if (!itemsInput?.length)
            throw new common_1.BadRequestException('Sin productos');
        const [empRow] = await dataSource.query(`SELECT config_especial FROM empresas WHERE id = ? LIMIT 1`, [config.empresa_id]);
        const camposConfig = (0, campos_formulario_helper_1.resolveCamposFormulario)(empRow?.config_especial);
        const CAMPO_A_BODY = {
            nombre: cliente_nombre,
            telefono: cliente_tel,
            email: cliente_email,
            direccion: direccion_envio,
            empresa: cliente_empresa,
            notas: notas_cliente,
        };
        for (const [campo, campoConf] of Object.entries(camposConfig)) {
            if (campoConf.ecommerce && campoConf.activo && campoConf.requerido) {
                const val = CAMPO_A_BODY[campo];
                const isEmpty = !val || (typeof val === 'string' && !val.trim()) || (typeof val === 'object' && !Object.values(val).some((v) => v));
                if (isEmpty)
                    throw new common_1.BadRequestException(`El campo "${campoConf.label}" es obligatorio`);
            }
        }
        const items = [];
        let subtotal = 0;
        let esMayoreo = false;
        for (const item of itemsInput) {
            const [prod] = await dataSource.query(`SELECT p.id, p.nombre, p.sku, p.precio, p.controla_stock, p.stock_actual,
                ep.precio_mayoreo, ep.qty_min_mayoreo
         FROM productos p
         LEFT JOIN ecommerce_producto_config ep ON ep.producto_id = p.id
         WHERE p.id = ? AND p.empresa_id = ? AND p.activo = 1`, [item.producto_id, config.empresa_id]);
            if (!prod)
                throw new common_1.BadRequestException(`Producto ${item.producto_id} no encontrado`);
            if (prod.controla_stock && prod.stock_actual < item.qty) {
                throw new common_1.BadRequestException(`Stock insuficiente para ${prod.nombre}`);
            }
            const qtyMin = prod.qty_min_mayoreo ?? config.qty_min_mayoreo;
            const aplicaMayoreo = config.modo_mayoreo && prod.precio_mayoreo && item.qty >= qtyMin;
            if (aplicaMayoreo)
                esMayoreo = true;
            const precioUnitario = aplicaMayoreo ? +prod.precio_mayoreo : +prod.precio;
            const itemSubtotal = precioUnitario * item.qty;
            subtotal += itemSubtotal;
            items.push({
                producto_id: prod.id,
                nombre: prod.nombre,
                sku: prod.sku,
                qty: item.qty,
                precio_unitario: precioUnitario,
                subtotal: itemSubtotal,
            });
        }
        const yy = new Date().getFullYear().toString().slice(-2);
        const [lastRow] = await dataSource.query(`SELECT numero_pedido FROM ecommerce_pedidos WHERE empresa_id = ? ORDER BY id DESC LIMIT 1`, [config.empresa_id]);
        let seq = 1;
        if (lastRow?.numero_pedido) {
            const parts = lastRow.numero_pedido.split('-');
            seq = (parseInt(parts[parts.length - 1]) || 0) + 1;
        }
        const numero_pedido = `EP-${yy}-${String(seq).padStart(4, '0')}`;
        const pedido = this.pedidoRepo.create({
            empresa_id: config.empresa_id,
            tenant_id: config.tenant_id,
            numero_pedido,
            tipo_venta: esMayoreo ? 'mayoreo' : 'menudeo',
            cliente_nombre,
            cliente_email,
            cliente_tel: cliente_tel || null,
            cliente_empresa: cliente_empresa?.trim() || null,
            direccion_envio: direccion_envio || null,
            items,
            subtotal,
            descuento: 0,
            iva: 0,
            total: subtotal,
            estado: 'pendiente',
            notas_cliente: notas_cliente || null,
        });
        await this.pedidoRepo.save(pedido);
        return { numero_pedido, total: subtotal, tipo_venta: pedido.tipo_venta, estado: 'pendiente' };
    }
    async getPublicPedido(subdominio, numero_pedido, dataSource) {
        const config = await this.getConfigBySubdominio(subdominio);
        const pedido = await this.pedidoRepo.findOne({ where: { numero_pedido, empresa_id: config.empresa_id } });
        if (!pedido)
            throw new common_1.NotFoundException('Pedido no encontrado');
        return {
            numero_pedido: pedido.numero_pedido,
            estado: pedido.estado,
            tipo_venta: pedido.tipo_venta,
            subtotal: pedido.subtotal,
            descuento: pedido.descuento,
            iva: pedido.iva,
            total: pedido.total,
            items: pedido.items,
            cliente_nombre: pedido.cliente_nombre,
            cliente_email: pedido.cliente_email,
            cliente_tel: pedido.cliente_tel,
            direccion_envio: pedido.direccion_envio,
            notas_cliente: pedido.notas_cliente,
            created_at: pedido.created_at,
        };
    }
};
exports.EcommerceService = EcommerceService;
exports.EcommerceService = EcommerceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ecommerce_config_entity_1.EcommerceConfig)),
    __param(1, (0, typeorm_1.InjectRepository)(ecommerce_pedido_entity_1.EcommercePedido)),
    __param(2, (0, typeorm_1.InjectRepository)(ecommerce_producto_config_entity_1.EcommerceProductoConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EcommerceService);
//# sourceMappingURL=ecommerce.service.js.map