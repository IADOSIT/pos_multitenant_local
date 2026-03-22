import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Pedido, PedidoDetalle, PedidoEstado } from '../pedidos/pedido.entity';
import { Mesa } from '../mesas/mesa.entity';
import { MesasService } from '../mesas/mesas.service';
import { EncuestasService } from '../encuestas/encuestas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SelfOrderService {
  private logger = new Logger('SelfOrderService');

  constructor(
    @InjectRepository(Pedido) private pedidoRepo: Repository<Pedido>,
    @InjectRepository(Mesa) private mesaRepo: Repository<Mesa>,
    private mesasService: MesasService,
    private encuestasService: EncuestasService,
    private notificacionesService: NotificacionesService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // Obtener info de tienda + mesa para el cliente (sin auth)
  async getTiendaPublica(tienda_id: number, mesa_numero: number) {
    const mesa = await this.mesaRepo.findOne({
      where: { tienda_id, numero: mesa_numero, activo: true },
    });
    if (!mesa) throw new NotFoundException('Mesa no encontrada');

    const [tienda] = await this.dataSource.query(
      `SELECT t.nombre, t.config_pos, e.nombre as empresa_nombre, e.logo_url
       FROM tiendas t JOIN empresas e ON t.empresa_id = e.id
       WHERE t.id = ? AND t.activo = 1`,
      [tienda_id],
    );
    if (!tienda) throw new NotFoundException('Tienda no encontrada');

    const configPos = typeof tienda.config_pos === 'string' ? JSON.parse(tienda.config_pos) : tienda.config_pos;
    if (!configPos?.self_order_enabled) throw new BadRequestException('Self Order no está activo en esta tienda');

    return {
      tienda_nombre: tienda.nombre,
      empresa_nombre: tienda.empresa_nombre,
      empresa_logo: tienda.logo_url,
      mesa_numero,
      mesa_nombre: mesa.nombre,
      mesa_id: mesa.id,
    };
  }

  // Limpia descripciones: quita diacríticos (á→a, é→e, ñ→n) y caracteres no ASCII
  private cleanDesc(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // combinating diacritics → base letter
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '') // remove remaining non-ASCII
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Obtener menú publicado para self-order (productos y categorías activos)
  async getMenuPublico(tienda_id: number) {
    const categorias = await this.dataSource.query(
      `SELECT c.id, c.nombre, c.color, c.icono, c.imagen_url, c.orden
       FROM categorias c
       INNER JOIN tiendas t ON t.empresa_id = c.empresa_id
       WHERE t.id = ? AND c.activo = 1
       ORDER BY c.orden ASC`,
      [tienda_id],
    );
    const productos = await this.dataSource.query(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen_url, p.categoria_id, p.impuesto_pct, p.unidad
       FROM productos p
       INNER JOIN tiendas t ON t.id = ? AND t.empresa_id = p.empresa_id
       LEFT JOIN producto_tienda pt ON pt.producto_id = p.id AND pt.tienda_id = ?
       WHERE p.activo = 1 AND p.disponible = 1
         AND (pt.id IS NULL OR pt.disponible = 1)
       ORDER BY p.orden ASC, p.nombre ASC`,
      [tienda_id, tienda_id],
    );
    return {
      categorias,
      productos: productos.map((p: any) => ({ ...p, descripcion: this.cleanDesc(p.descripcion) })),
    };
  }

  // Crear pedido desde cliente (sin auth)
  async crearPedidoCliente(tienda_id: number, mesa_numero: number, body: any) {
    const mesa = await this.mesaRepo.findOne({ where: { tienda_id, numero: mesa_numero, activo: true } });
    if (!mesa) throw new NotFoundException('Mesa no encontrada');

    const [tienda] = await this.dataSource.query(
      `SELECT tenant_id, empresa_id, config_pos FROM tiendas WHERE id = ?`,
      [tienda_id],
    );
    if (!tienda) throw new NotFoundException('Tienda no encontrada');

    const configPos = typeof tienda.config_pos === 'string' ? JSON.parse(tienda.config_pos) : tienda.config_pos;
    if (!configPos?.self_order_enabled) throw new BadRequestException('Self Order no está activo');

    if (!body.cliente_nombre?.trim()) throw new BadRequestException('El nombre es obligatorio');
    if (!body.items?.length) throw new BadRequestException('El pedido está vacío');

    // Buscar mesero asignado a la mesa
    const asignacion = await this.mesasService.getMeseroAsignado(mesa.id, tienda_id);

    const encuesta_token = uuidv4();
    const folio = `SO-${Date.now().toString(36).toUpperCase()}`;

    const pedidoData: any = {
      tenant_id: tienda.tenant_id,
      empresa_id: tienda.empresa_id,
      tienda_id,
      usuario_id: null,
      usuario_nombre: body.cliente_nombre,
      folio,
      mesa: mesa_numero,
      subtotal: body.subtotal,
      descuento: body.descuento || 0,
      impuestos: body.impuestos || 0,
      total: body.total,
      notas: body.notas || null,
      cliente_nombre: body.cliente_nombre,
      self_order: true,
      mesero_id: asignacion?.user_id || null,
      mesero_nombre: asignacion?.user_nombre || null,
      mesero_confirmado: false,
      encuesta_token,
      detalles: body.items.map((item: any) => ({
        producto_id: item.producto_id,
        producto_nombre: item.nombre,
        producto_sku: item.sku || '',
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        descuento: item.descuento || 0,
        impuesto: item.impuesto || 0,
        subtotal: item.cantidad * item.precio - (item.descuento || 0),
        modificadores: item.modificadores || null,
        notas: item.notas || null,
      })),
    };

    const saved = (await this.pedidoRepo.save(this.pedidoRepo.create(pedidoData))) as unknown as Pedido;

    // Notificar al mesero o a toda la tienda
    this.notificacionesService.emitToTienda(tienda_id, 'nuevo_pedido_selforder', {
      id: saved.id,
      folio: saved.folio,
      mesa: mesa_numero,
      cliente_nombre: body.cliente_nombre,
      total: saved.total,
      items: body.items.length,
      mesero_id: asignacion?.user_id || null,
      created_at: saved.created_at,
    });

    this.logger.log(`Self-order ${folio} creado - Mesa ${mesa_numero} - ${body.cliente_nombre}`);

    return {
      pedido_id: saved.id,
      folio: saved.folio,
      encuesta_token,
      estado: saved.estado,
    };
  }

  // Polling del cliente para ver estado de su pedido
  async getEstadoPedido(encuesta_token: string) {
    const pedido = await this.pedidoRepo.findOne({ where: { encuesta_token } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    return {
      estado: pedido.estado,
      mesero_confirmado: pedido.mesero_confirmado,
      venta_id: pedido.venta_id,
      encuesta_lista: !!pedido.venta_id,
    };
  }

  // Confirmar pedido por el mesero
  async confirmarPedidoMesero(pedido_id: number, scope: any) {
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedido_id, tienda_id: scope.tienda_id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (!pedido.self_order) throw new BadRequestException('No es un pedido self-order');

    await this.pedidoRepo.update(pedido_id, {
      mesero_confirmado: true,
      mesero_id: scope.sub || scope.id,
      mesero_nombre: scope.nombre,
      estado: PedidoEstado.EN_ELABORACION,
    });

    const updated = await this.pedidoRepo.findOne({ where: { id: pedido_id } });

    this.notificacionesService.emitToTienda(scope.tienda_id, 'pedido_actualizado', {
      id: pedido_id,
      folio: pedido.folio,
      mesa: pedido.mesa,
      estado: PedidoEstado.EN_ELABORACION,
      mesero_confirmado: true,
    });

    return updated;
  }

  // Rechazar pedido self-order
  async rechazarPedido(pedido_id: number, motivo: string, scope: any) {
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedido_id, tienda_id: scope.tienda_id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    pedido.estado = PedidoEstado.CANCELADO;
    pedido.notas = `RECHAZADO: ${motivo}`;
    await this.pedidoRepo.save(pedido);

    this.notificacionesService.emitToTienda(scope.tienda_id, 'pedido_actualizado', {
      id: pedido.id,
      folio: pedido.folio,
      mesa: pedido.mesa,
      estado: pedido.estado,
    });

    return pedido;
  }

  // Crear encuesta al cobrar (llamado desde PedidosService.cobrar)
  async crearEncuestaAlCobrar(pedido: Pedido) {
    if (!pedido.self_order) return;
    await this.encuestasService.create({
      pedido_id: pedido.id,
      tenant_id: pedido.tenant_id,
      empresa_id: pedido.empresa_id,
      tienda_id: pedido.tienda_id,
      mesa_numero: pedido.mesa,
      mesero_id: pedido.mesero_id,
      mesero_nombre: pedido.mesero_nombre,
      cliente_nombre: pedido.cliente_nombre,
      completada: false,
    });
    this.logger.log(`Encuesta creada para pedido ${pedido.folio}`);
  }

  // Responder encuesta (público - cliente)
  async responderEncuesta(encuesta_token: string, data: { calificacion_servicio: number; calificacion_comida: number; comentario?: string }) {
    const pedido = await this.pedidoRepo.findOne({ where: { encuesta_token } });
    if (!pedido) throw new NotFoundException('Token inválido');
    if (!pedido.venta_id) throw new BadRequestException('El pago aún no se ha procesado');

    return this.encuestasService.responder(pedido.id, data);
  }

  // KPIs para dashboard self-order
  async getKPIs(scope: any, desde?: string, hasta?: string) {
    const hasDate = !!(desde && hasta);
    const dateClause = hasDate ? 'AND p.created_at BETWEEN ? AND ?' : '';
    const dateParams: any[] = hasDate ? [desde, `${hasta} 23:59:59`] : [];

    const [stats] = await this.dataSource.query(`
      SELECT
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN p.self_order = 1 THEN 1 END) as total_self_order,
        COUNT(CASE WHEN p.venta_id IS NOT NULL THEN 1 END) as pedidos_cobrados,
        COUNT(CASE WHEN p.estado = 'cancelado' THEN 1 END) as pedidos_cancelados,
        COUNT(CASE WHEN p.estado = 'cancelado' THEN 1 END) as rechazados,
        SUM(CASE WHEN p.venta_id IS NOT NULL THEN p.total ELSE 0 END) as total_ventas,
        AVG(CASE WHEN p.venta_id IS NOT NULL THEN p.total END) as ticket_promedio,
        AVG(CASE WHEN p.mesero_confirmado = 1 THEN
          TIMESTAMPDIFF(SECOND, p.created_at, p.updated_at) END) as seg_confirmacion_promedio
      FROM pedidos p
      WHERE p.tienda_id = ? AND p.self_order = 1 ${dateClause}
    `, [scope.tienda_id, ...dateParams]);

    const porMesa = await this.dataSource.query(`
      SELECT p.mesa, COUNT(*) as total, SUM(CASE WHEN p.venta_id IS NOT NULL THEN p.total ELSE 0 END) as ventas
      FROM pedidos p
      WHERE p.tienda_id = ? AND p.self_order = 1 ${dateClause}
      GROUP BY p.mesa ORDER BY total DESC LIMIT 10
    `, [scope.tienda_id, ...dateParams]);

    const porMesero = await this.dataSource.query(`
      SELECT p.mesero_nombre, p.mesero_id,
        COUNT(*) as total_pedidos,
        SUM(CASE WHEN p.venta_id IS NOT NULL THEN p.total ELSE 0 END) as ventas_total,
        AVG(e.calificacion_servicio) as calificacion_promedio
      FROM pedidos p
      LEFT JOIN encuestas_servicio e ON e.pedido_id = p.id AND e.completada = 1
      WHERE p.tienda_id = ? AND p.self_order = 1 AND p.mesero_id IS NOT NULL ${dateClause}
      GROUP BY p.mesero_id, p.mesero_nombre ORDER BY ventas_total DESC
    `, [scope.tienda_id, ...dateParams]);

    const encuestaKPIs = await this.encuestasService.getKPIs(scope, desde, hasta);

    const encDateClause = hasDate ? 'AND created_at BETWEEN ? AND ?' : '';
    const totalEncuestas = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM encuestas_servicio WHERE tienda_id = ? ${encDateClause}`,
      [scope.tienda_id, ...dateParams],
    );

    const tasaEncuestas = totalEncuestas[0]?.total > 0
      ? +((encuestaKPIs.total / totalEncuestas[0].total) * 100).toFixed(1)
      : 0;

    return {
      ...stats,
      por_mesa: porMesa,
      por_mesero: porMesero,
      encuestas: encuestaKPIs,
      tasa_encuestas_completadas: tasaEncuestas,
    };
  }

  // Obtener tienda pública por slug
  async getTiendaPublicaBySlug(slug: string, mesa_numero: number) {
    const rows = await this.dataSource.query(
      'SELECT id FROM tiendas WHERE slug = ? AND activo = 1',
      [slug],
    );
    if (!rows.length) throw new NotFoundException('Tienda no encontrada');
    return this.getTiendaPublica(rows[0].id, mesa_numero);
  }

  // Obtener menú público por slug
  async getMenuPublicoBySlug(slug: string) {
    const rows = await this.dataSource.query(
      'SELECT id FROM tiendas WHERE slug = ? AND activo = 1',
      [slug],
    );
    if (!rows.length) throw new NotFoundException('Tienda no encontrada');
    return this.getMenuPublico(rows[0].id);
  }

  // Crear pedido cliente por slug
  async crearPedidoBySlug(slug: string, mesa_numero: number, body: any) {
    const rows = await this.dataSource.query(
      'SELECT id FROM tiendas WHERE slug = ? AND activo = 1',
      [slug],
    );
    if (!rows.length) throw new NotFoundException('Tienda no encontrada');
    return this.crearPedidoCliente(rows[0].id, mesa_numero, body);
  }

  // Generar QR imprimible como HTML
  async getQRPrintable(tienda_id: number, mesa_id: number, baseUrl: string) {
    const mesa = await this.mesaRepo.findOne({ where: { id: mesa_id, tienda_id, activo: true } });
    if (!mesa) throw new NotFoundException('Mesa no encontrada');

    const [tienda] = await this.dataSource.query(
      `SELECT t.nombre, t.config_pos, e.nombre as empresa_nombre, e.logo_url
       FROM tiendas t JOIN empresas e ON t.empresa_id = e.id WHERE t.id = ?`,
      [tienda_id],
    );

    // Prioridad: URL configurada en la tienda > URL del frontend (window.location.origin) > host del request
    let configPos: any = {};
    try { configPos = tienda?.config_pos ? JSON.parse(tienda.config_pos) : {}; } catch { configPos = {}; }
    const effectiveBase = configPos.self_order_url || baseUrl;
    const url = `${effectiveBase}/self-order/${tienda_id}/${mesa.numero}`;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const QRCode = require('qrcode');
    const qrDataUrl: string = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });

    const logoHtml = tienda.logo_url
      ? `<img src="${baseUrl}${tienda.logo_url}" alt="logo" style="max-height:60px;margin-bottom:8px;" />`
      : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mesa ${mesa.numero} - Self Order</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; }
    .card { width: 320px; margin: 20px auto; border: 2px solid #e2e8f0; border-radius: 20px; padding: 28px 24px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .logo-area { margin-bottom: 12px; }
    .empresa { font-size: 13px; color: #334155; font-weight: 600; margin-bottom: 4px; }
    .mesa-badge { display: inline-block; background: #0f172a; color: #fff; font-size: 28px; font-weight: 800; padding: 8px 28px; border-radius: 50px; margin: 10px 0; letter-spacing: 1px; }
    .headline { font-size: 17px; font-weight: 700; color: #0f172a; margin: 10px 0 4px; }
    .subline { font-size: 13px; color: #334155; font-weight: 500; margin-bottom: 14px; }
    .qr-img { width: 200px; height: 200px; margin: 0 auto; display: block; border-radius: 12px; border: 2px solid #0f172a; }
    .escanea { font-size: 12px; color: #1e293b; font-weight: 600; margin: 8px 0 16px; }
    .steps { text-align: left; background: #f1f5f9; border-radius: 12px; padding: 14px 16px; margin-top: 4px; border: 1px solid #cbd5e1; }
    .steps h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #334155; font-weight: 700; margin-bottom: 10px; }
    .step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
    .step-icon { font-size: 18px; line-height: 1.2; flex-shrink: 0; }
    .step-text { font-size: 12px; color: #1e293b; line-height: 1.4; }
    .step-text strong { display: block; font-size: 12px; color: #0f172a; font-weight: 700; }
    .btn-print { display: block; width: 100%; margin-top: 16px; padding: 12px; background: #0f172a; color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; }
    .btn-print:hover { background: #1e293b; }
    @media print { .btn-print { display: none; } body { margin: 0; } .card { box-shadow: none; margin: 0; border: 1px solid #ccc; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-area">${logoHtml}</div>
    <div class="empresa">${tienda.empresa_nombre || ''}</div>
    <div class="mesa-badge">Mesa ${mesa.numero}${mesa.nombre ? ' · ' + mesa.nombre : ''}</div>
    <div class="headline">¡Haz tu pedido aquí!</div>
    <div class="subline">Escanea el QR con tu celular</div>
    <img class="qr-img" src="${qrDataUrl}" alt="QR Mesa ${mesa.numero}" />
    <div class="escanea">📱 Apunta tu cámara al código</div>
    <div class="steps">
      <h4>Cómo funciona</h4>
      <div class="step">
        <span class="step-icon">📷</span>
        <span class="step-text"><strong>1. Escanea</strong>Abre la cámara y apunta al QR</span>
      </div>
      <div class="step">
        <span class="step-icon">🍽️</span>
        <span class="step-text"><strong>2. Elige</strong>Selecciona lo que deseas del menú</span>
      </div>
      <div class="step">
        <span class="step-icon">✅</span>
        <span class="step-text"><strong>3. Confirma</strong>Ingresa tu nombre y envía el pedido</span>
      </div>
      <div class="step">
        <span class="step-icon">💳</span>
        <span class="step-text"><strong>4. Paga en caja</strong>Al terminar paga con el mesero</span>
      </div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir QR</button>
  </div>
</body>
</html>`;
  }
}
