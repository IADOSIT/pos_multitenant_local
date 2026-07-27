import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { ConfigBascula } from './config-bascula.entity';
import { PesajeLog } from './pesaje-log.entity';
import { generarBarcodeEan13 } from '../../common/utils/ean13.util';
import { BasculaGateway } from './bascula.gateway';
import { VentasService } from '../ventas/ventas.service';

@Injectable()
export class BasculaService {
  private readonly logger = new Logger('BasculaService');

  constructor(
    @InjectRepository(ConfigBascula) private configRepo: Repository<ConfigBascula>,
    @InjectRepository(PesajeLog) private logRepo: Repository<PesajeLog>,
    @InjectDataSource() private dataSource: DataSource,
    private gateway: BasculaGateway,
    private ventasService: VentasService,
  ) {}

  async getOrCreateConfig(tiendaId: number, scope: any): Promise<ConfigBascula> {
    let config = await this.configRepo.findOne({ where: { tienda_id: tiendaId } });
    if (!config) {
      const [tienda] = await this.dataSource.query(
        `SELECT tenant_id, empresa_id FROM tiendas WHERE id = ?`,
        [tiendaId],
      );
      if (!tienda) throw new NotFoundException('Tienda no encontrada');
      const tenantId = scope.tenant_id ?? tienda.tenant_id;
      const empresaId = scope.empresa_id ?? tienda.empresa_id;
      config = this.configRepo.create({
        tienda_id: tiendaId,
        tenant_id: tenantId,
        empresa_id: empresaId,
        activo: false,
        tienda_token: randomBytes(24).toString('hex'),
      });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(tiendaId: number, dto: Partial<ConfigBascula>, scope: any): Promise<ConfigBascula> {
    const config = await this.getOrCreateConfig(tiendaId, scope);
    const allowed = [
      'activo', 'modo', 'printer_ip', 'printer_port', 'label_width_mm', 'label_height_mm',
      'scale_port', 'scale_baud_rate', 'scale_protocol',
    ];
    for (const key of allowed) {
      if ((dto as any)[key] !== undefined) (config as any)[key] = (dto as any)[key];
    }
    return this.configRepo.save(config);
  }

  async regenerateToken(tiendaId: number, scope: any): Promise<{ tienda_token: string }> {
    const config = await this.getOrCreateConfig(tiendaId, scope);
    config.tienda_token = randomBytes(24).toString('hex');
    await this.configRepo.save(config);
    return { tienda_token: config.tienda_token };
  }

  // Productos vendibles por peso — reutiliza el campo `unidad` que ya existe en Producto,
  // sin necesidad de una columna nueva.
  async getProductosPorPeso(tiendaId: number, scope: any) {
    const [tienda] = await this.dataSource.query(`SELECT empresa_id FROM tiendas WHERE id = ?`, [tiendaId]);
    if (!tienda) throw new NotFoundException('Tienda no encontrada');
    return this.dataSource.query(
      `SELECT id, nombre, precio, imagen_url, categoria_id
       FROM productos
       WHERE empresa_id = ? AND unidad = 'kg' AND activo = 1 AND disponible = 1
       ORDER BY nombre ASC`,
      [tienda.empresa_id],
    );
  }

  private async getProductoOrThrow(productoId: number) {
    const [producto] = await this.dataSource.query(
      `SELECT id, nombre, sku, precio, tenant_id, empresa_id FROM productos WHERE id = ?`,
      [productoId],
    );
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  // Modo "auto_despacho": imprime etiqueta con el precio, el cliente paga despues en caja.
  async registrarPesaje(dto: { tienda_id: number; producto_id: number; peso_kg: number }, scope: any) {
    if (!dto.peso_kg || dto.peso_kg <= 0) throw new BadRequestException('Peso invalido');

    const config = await this.getOrCreateConfig(dto.tienda_id, scope);
    if (!config.activo) throw new BadRequestException('La bascula de autoservicio no esta activa en esta tienda');
    if (config.modo !== 'auto_despacho') throw new BadRequestException('Esta tienda esta configurada en modo autocobro');

    const producto = await this.getProductoOrThrow(dto.producto_id);
    const precioTotal = Math.round(dto.peso_kg * Number(producto.precio) * 100) / 100;
    const precioCentavos = Math.round(precioTotal * 100);
    const barcode = generarBarcodeEan13(producto.id, precioCentavos);

    const log = await this.logRepo.save(this.logRepo.create({
      tenant_id: config.tenant_id,
      empresa_id: config.empresa_id,
      tienda_id: dto.tienda_id,
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      peso_kg: dto.peso_kg,
      precio_total: precioTotal,
      barcode,
    }));

    this.gateway.emitPrintLabel(dto.tienda_id, {
      pagado: false,
      producto_nombre: producto.nombre,
      peso_kg: dto.peso_kg,
      precio_total: precioTotal,
      barcode,
      label_width_mm: config.label_width_mm,
      label_height_mm: config.label_height_mm,
      printer_ip: config.printer_ip,
      printer_port: config.printer_port,
    });

    this.logger.log(`Pesaje registrado: ${producto.nombre} ${dto.peso_kg}kg = $${precioTotal} (${barcode})`);

    return { producto_nombre: producto.nombre, peso_kg: dto.peso_kg, precio_total: precioTotal, barcode, log_id: log.id };
  }

  // Modo "autocobro": pesa y cobra ahi mismo — registra una venta real (misma logica que
  // PedidosService.cobrar) y manda imprimir un recibo en vez de una etiqueta de precio.
  async cobrarPesaje(
    dto: {
      tienda_id: number; producto_id: number; peso_kg: number; caja_id: number;
      metodo_pago: string; pago_efectivo?: number; pago_tarjeta?: number; cambio?: number;
    },
    scope: any,
  ) {
    if (!dto.peso_kg || dto.peso_kg <= 0) throw new BadRequestException('Peso invalido');
    if (!dto.caja_id) throw new BadRequestException('No hay caja activa');

    const config = await this.getOrCreateConfig(dto.tienda_id, scope);
    if (!config.activo) throw new BadRequestException('La bascula de autoservicio no esta activa en esta tienda');
    if (config.modo !== 'autocobro') throw new BadRequestException('Esta tienda esta configurada en modo auto-despacho');

    const producto = await this.getProductoOrThrow(dto.producto_id);
    const precioTotal = Math.round(dto.peso_kg * Number(producto.precio) * 100) / 100;

    const venta = await this.ventasService.crear({
      caja_id: dto.caja_id,
      items: [{
        producto_id: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        precio: precioTotal,
        cantidad: 1,
      }],
      subtotal: precioTotal,
      descuento: 0,
      impuestos: 0,
      total: precioTotal,
      metodo_pago: dto.metodo_pago,
      pago_efectivo: dto.pago_efectivo,
      pago_tarjeta: dto.pago_tarjeta,
      cambio: dto.cambio || 0,
      notas: `Autocobro bascula — ${dto.peso_kg}kg`,
    }, scope);

    const log = await this.logRepo.save(this.logRepo.create({
      tenant_id: config.tenant_id,
      empresa_id: config.empresa_id,
      tienda_id: dto.tienda_id,
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      peso_kg: dto.peso_kg,
      precio_total: precioTotal,
      barcode: generarBarcodeEan13(producto.id, Math.round(precioTotal * 100)),
      venta_id: venta.id,
    }));

    this.gateway.emitPrintLabel(dto.tienda_id, {
      pagado: true,
      folio: venta.folio,
      producto_nombre: producto.nombre,
      peso_kg: dto.peso_kg,
      precio_total: precioTotal,
      barcode: log.barcode,
      label_width_mm: config.label_width_mm,
      label_height_mm: config.label_height_mm,
      printer_ip: config.printer_ip,
      printer_port: config.printer_port,
    });

    this.logger.log(`Autocobro: ${producto.nombre} ${dto.peso_kg}kg = $${precioTotal} — venta ${venta.folio}`);

    return { producto_nombre: producto.nombre, peso_kg: dto.peso_kg, precio_total: precioTotal, folio: venta.folio, venta_id: venta.id };
  }
}
