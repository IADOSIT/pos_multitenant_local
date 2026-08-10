import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EcommerceConfig } from './ecommerce-config.entity';
import { EcommercePedido } from './ecommerce-pedido.entity';
import { EcommerceProductoConfig } from './ecommerce-producto-config.entity';
import { resolveCamposFormulario } from '../empresas/campos-formulario.helper';

function slugify(text: string): string {
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

@Injectable()
export class EcommerceService {
  constructor(
    @InjectRepository(EcommerceConfig)
    private configRepo: Repository<EcommerceConfig>,
    @InjectRepository(EcommercePedido)
    private pedidoRepo: Repository<EcommercePedido>,
    @InjectRepository(EcommerceProductoConfig)
    private productoConfigRepo: Repository<EcommerceProductoConfig>,
  ) {}

  // ─── CONFIG ADMIN ────────────────────────────────────────────────────────────

  async getConfig(scope: any): Promise<EcommerceConfig | null> {
    return this.configRepo.findOne({ where: { empresa_id: scope.empresa_id } });
  }

  async upsertConfig(scope: any, data: Partial<EcommerceConfig>): Promise<EcommerceConfig> {
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
        throw new BadRequestException('Subdominio no disponible');
      }
    }

    if (!data.subdominio && data.activo && !config.subdominio) {
      data.subdominio = await this.generarSubdominioUnico('mi-tienda');
    }

    Object.assign(config, data);
    return this.configRepo.save(config);
  }

  async verificarSubdominio(subdominio: string, empresaId: number): Promise<{ disponible: boolean }> {
    const slug = slugify(subdominio);
    const exists = await this.configRepo.findOne({ where: { subdominio: slug } });
    return { disponible: !exists || exists.empresa_id === empresaId };
  }

  async generarSubdominioUnico(nombre: string): Promise<string> {
    let base = slugify(nombre);
    if (!base) base = 'mi-tienda';
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
      { id: 'iados-electronica', nombre: 'iaDoS Electrónica', descripcion: 'Estilo electrónica/tech: naranja intenso, tipografía Dosis y tarjetas nítidas', modo: 'light', colorPrimary: '#ff8717', colorBg: '#ffffff' },
      { id: 'iados-market', nombre: 'iaDoS Market', descripcion: 'Estilo super/grocery: verde fresco, tipografía Barlow, look limpio y amable', modo: 'light', colorPrimary: '#629d23', colorBg: '#ffffff' },
    ];
  }

  // ─── PRODUCTO CONFIG ECOMMERCE ────────────────────────────────────────────────

  async getProductoConfig(productoId: number): Promise<EcommerceProductoConfig | null> {
    return this.productoConfigRepo.findOne({ where: { producto_id: productoId } });
  }

  async upsertProductoConfig(scope: any, productoId: number, data: Partial<EcommerceProductoConfig>): Promise<EcommerceProductoConfig> {
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

  async bulkVisibilidad(scope: any, ids: number[], visible: boolean): Promise<void> {
    for (const id of ids) {
      await this.upsertProductoConfig(scope, id, { visible_ecommerce: visible });
    }
  }

  // ─── PEDIDOS ADMIN ────────────────────────────────────────────────────────────

  async listPedidos(scope: any, query: any) {
    const { page = 1, limit = 20, estado, tipo_venta, fecha_desde, fecha_hasta, buscar } = query;
    const qb = this.pedidoRepo.createQueryBuilder('p')
      .where('p.empresa_id = :eid', { eid: scope.empresa_id })
      .orderBy('p.created_at', 'DESC');

    if (estado) qb.andWhere('p.estado = :estado', { estado });
    if (tipo_venta) qb.andWhere('p.tipo_venta = :tv', { tv: tipo_venta });
    if (fecha_desde) qb.andWhere('p.created_at >= :fd', { fd: new Date(fecha_desde) });
    if (fecha_hasta) qb.andWhere('p.created_at <= :fh', { fh: new Date(fecha_hasta) });
    if (buscar) qb.andWhere('(p.numero_pedido LIKE :b OR p.cliente_nombre LIKE :b OR p.cliente_email LIKE :b)', { b: `%${buscar}%` });

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, meta: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) } };
  }

  async getPedido(scope: any, id: number) {
    const p = await this.pedidoRepo.findOne({ where: { id, empresa_id: scope.empresa_id } });
    if (!p) throw new NotFoundException('Pedido no encontrado');
    return p;
  }

  async updateEstadoPedido(scope: any, id: number, estado: string, notas_internas?: string) {
    const p = await this.getPedido(scope, id);
    p.estado = estado;
    if (notas_internas !== undefined) p.notas_internas = notas_internas;
    return this.pedidoRepo.save(p);
  }

  async deletePedido(scope: any, id: number) {
    const p = await this.getPedido(scope, id);
    if (p.estado !== 'pendiente') throw new BadRequestException('Solo se pueden eliminar pedidos pendientes');
    await this.pedidoRepo.remove(p);
    return { ok: true };
  }

  // ─── API PÚBLICA ──────────────────────────────────────────────────────────────

  async getConfigBySubdominio(subdominio: string): Promise<EcommerceConfig> {
    const config = await this.configRepo.findOne({ where: { subdominio, activo: true } });
    if (!config) throw new NotFoundException('Tienda no disponible');
    return config;
  }

  async getPublicInfo(subdominio: string, dataSource: any) {
    const config = await this.getConfigBySubdominio(subdominio);
    const [empresa] = await dataSource.query(
      'SELECT nombre, telefono, email, direccion, logo_url, config_especial FROM empresas WHERE id = ?',
      [config.empresa_id],
    );
    const campos_formulario = resolveCamposFormulario(empresa?.config_especial);
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

  async getPublicCategorias(subdominio: string, dataSource: any) {
    const config = await this.getConfigBySubdominio(subdominio);
    const rows = await dataSource.query(
      `SELECT c.id, c.nombre, c.imagen_url,
        COUNT(p.id) as total_productos
       FROM categorias c
       INNER JOIN productos p ON p.categoria_id = c.id AND p.empresa_id = ? AND p.activo = 1 AND p.disponible = 1
       LEFT JOIN ecommerce_producto_config ep ON ep.producto_id = p.id
       WHERE c.empresa_id = ? AND c.activo = 1
         AND (ep.visible_ecommerce IS NULL OR ep.visible_ecommerce = 1)
         AND (p.controla_stock = 0 OR p.stock_actual > 0)
       GROUP BY c.id, c.nombre, c.imagen_url
       HAVING total_productos > 0
       ORDER BY c.orden ASC`,
      [config.empresa_id, config.empresa_id],
    );
    return rows;
  }

  async getPublicProductos(subdominio: string, dataSource: any, query: any) {
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
    const params: any[] = [config.empresa_id];

    if (con_stock === 'true') {
      sql += ' AND (p.controla_stock = 0 OR p.stock_actual > 0)';
    }
    if (categoria_id) { sql += ' AND p.categoria_id = ?'; params.push(categoria_id); }
    if (buscar) { sql += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)'; params.push(`%${buscar}%`, `%${buscar}%`); }

    const orderMap: Record<string, string> = {
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
    const data = rows.map((r: any) => ({
      ...r,
      precio_venta: mostrarPrecios ? r.precio_venta : null,
      precio_mayoreo: mostrarPrecios ? r.precio_mayoreo : null,
      imagenes: [r.imagen_url, ...(r.imagenes_extra ? JSON.parse(r.imagenes_extra) : [])].filter(Boolean),
      etiquetas: r.etiquetas ? JSON.parse(r.etiquetas) : [],
      categoria: { id: r.categoria_id, nombre: r.categoria_nombre },
    }));

    return { data, meta: { total: +total, page: +page, limit: +limit, pages: Math.ceil(total / limit) } };
  }

  // Config especial de la empresa — usado para ocultar precios en catálogos públicos
  private async mostrarPreciosParaEmpresa(empresa_id: number, dataSource: any): Promise<boolean> {
    const rows = await dataSource.query('SELECT config_especial FROM empresas WHERE id = ? LIMIT 1', [empresa_id]);
    const cfgRaw = rows[0]?.config_especial;
    const cfg = (typeof cfgRaw === 'string' ? JSON.parse(cfgRaw) : cfgRaw) || {};
    return cfg.mostrar_precios !== false;
  }

  async getPublicProductoBySlug(subdominio: string, slug: string, dataSource: any) {
    const config = await this.getConfigBySubdominio(subdominio);
    const [row] = await dataSource.query(
      `SELECT p.id, p.nombre, p.descripcion, p.sku,
              p.precio as precio_venta, p.imagen_url,
              p.controla_stock, p.stock_actual as stock,
              p.categoria_id,
              ep.precio_mayoreo, ep.qty_min_mayoreo, ep.descripcion_larga,
              ep.imagenes_extra, ep.slug, ep.etiquetas, ep.visible_ecommerce,
              c.nombre as categoria_nombre
       FROM productos p
       LEFT JOIN ecommerce_producto_config ep ON ep.producto_id = p.id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE (ep.slug = ? OR p.id = ?) AND p.empresa_id = ? AND p.activo = 1`,
      [slug, slug, config.empresa_id],
    );
    if (!row) throw new NotFoundException('Producto no encontrado');

    const relacionados = await dataSource.query(
      `SELECT p.id, p.nombre, p.precio, p.imagen_url, ep.slug
       FROM productos p
       LEFT JOIN ecommerce_producto_config ep ON ep.producto_id = p.id
       WHERE p.categoria_id = ? AND p.empresa_id = ? AND p.id != ? AND p.activo = 1
         AND COALESCE(ep.visible_ecommerce, 1) = 1
       LIMIT 4`,
      [row.categoria_id, config.empresa_id, row.id],
    );

    const mostrarPrecios = await this.mostrarPreciosParaEmpresa(config.empresa_id, dataSource);

    return {
      ...row,
      precio_venta: mostrarPrecios ? row.precio_venta : null,
      precio_mayoreo: mostrarPrecios ? row.precio_mayoreo : null,
      imagenes: [row.imagen_url, ...(row.imagenes_extra ? JSON.parse(row.imagenes_extra) : [])].filter(Boolean),
      etiquetas: row.etiquetas ? JSON.parse(row.etiquetas) : [],
      categoria: { id: row.categoria_id, nombre: row.categoria_nombre },
      relacionados: relacionados.map((r: any) => ({ ...r, precio: mostrarPrecios ? r.precio : null })),
    };
  }

  async crearPedidoPublico(subdominio: string, body: any, dataSource: any) {
    const config = await this.getConfigBySubdominio(subdominio);

    const cliente_nombre = body.cliente_nombre || body.cliente?.nombre;
    const cliente_email = body.cliente_email || body.cliente?.email;
    const cliente_tel = body.cliente_tel || body.cliente?.tel;
    const cliente_empresa = body.cliente_empresa;
    const { direccion_envio, items: itemsInput, notas_cliente } = body;

    if (!itemsInput?.length) throw new BadRequestException('Sin productos');

    const [empRow] = await dataSource.query(`SELECT config_especial FROM empresas WHERE id = ? LIMIT 1`, [config.empresa_id]);
    const camposConfig = resolveCamposFormulario(empRow?.config_especial);
    const CAMPO_A_BODY: Record<string, any> = {
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
        if (isEmpty) throw new BadRequestException(`El campo "${campoConf.label}" es obligatorio`);
      }
    }

    // Validar stock y calcular totales
    const items: any[] = [];
    let subtotal = 0;
    let esMayoreo = false;

    for (const item of itemsInput) {
      const [prod] = await dataSource.query(
        `SELECT p.id, p.nombre, p.sku, p.precio, p.controla_stock, p.stock_actual,
                ep.precio_mayoreo, ep.qty_min_mayoreo
         FROM productos p
         LEFT JOIN ecommerce_producto_config ep ON ep.producto_id = p.id
         WHERE p.id = ? AND p.empresa_id = ? AND p.activo = 1`,
        [item.producto_id, config.empresa_id],
      );
      if (!prod) throw new BadRequestException(`Producto ${item.producto_id} no encontrado`);
      if (prod.controla_stock && prod.stock_actual < item.qty) {
        throw new BadRequestException(`Stock insuficiente para ${prod.nombre}`);
      }

      const qtyMin = prod.qty_min_mayoreo ?? config.qty_min_mayoreo;
      const aplicaMayoreo = config.modo_mayoreo && prod.precio_mayoreo && item.qty >= qtyMin;
      if (aplicaMayoreo) esMayoreo = true;

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

    // Generar número de pedido EP-YY-NNNN
    const yy = new Date().getFullYear().toString().slice(-2);
    const [lastRow] = await dataSource.query(
      `SELECT numero_pedido FROM ecommerce_pedidos WHERE empresa_id = ? ORDER BY id DESC LIMIT 1`,
      [config.empresa_id],
    );
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

  async getPublicPedido(subdominio: string, numero_pedido: string, dataSource: any) {
    const config = await this.getConfigBySubdominio(subdominio);
    const pedido = await this.pedidoRepo.findOne({ where: { numero_pedido, empresa_id: config.empresa_id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
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
}
