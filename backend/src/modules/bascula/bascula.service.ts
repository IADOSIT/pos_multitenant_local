import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { ConfigBascula } from './config-bascula.entity';
import { PesajeLog } from './pesaje-log.entity';
import { generarBarcodeEan13 } from '../../common/utils/ean13.util';
import { BasculaGateway } from './bascula.gateway';

@Injectable()
export class BasculaService {
  private readonly logger = new Logger('BasculaService');

  constructor(
    @InjectRepository(ConfigBascula) private configRepo: Repository<ConfigBascula>,
    @InjectRepository(PesajeLog) private logRepo: Repository<PesajeLog>,
    @InjectDataSource() private dataSource: DataSource,
    private gateway: BasculaGateway,
  ) {}

  async getOrCreateConfig(tiendaId: number, scope: any): Promise<ConfigBascula> {
    let config = await this.configRepo.findOne({ where: { tienda_id: tiendaId } });
    if (!config) {
      const [tienda] = await this.dataSource.query(
        `SELECT tenant_id, empresa_id FROM tiendas WHERE id = ?`,
        [tiendaId],
      );
      if (!tienda) throw new NotFoundException('Tienda no encontrada');
      // El tenant/empresa son los de la tienda misma, nunca los de "scope" (quien la esta
      // configurando) — mismo bug que se encontro y corrigio en menu-digital.service.ts.
      config = this.configRepo.create({
        tienda_id: tiendaId,
        tenant_id: tienda.tenant_id,
        empresa_id: tienda.empresa_id,
        activo: false,
        usar_en_pos: false,
        tienda_token: randomBytes(24).toString('hex'),
      });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(tiendaId: number, dto: Partial<ConfigBascula>, scope: any): Promise<ConfigBascula> {
    const config = await this.getOrCreateConfig(tiendaId, scope);
    const allowed = [
      'activo', 'usar_en_pos', 'printer_modo', 'printer_ip', 'printer_port', 'label_width_mm', 'label_height_mm',
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

  // Kiosko de autoservicio (auto-despacho): pesa e imprime etiqueta con el precio —
  // el cliente pega la etiqueta y paga despues en cualquier caja que la escanee.
  // El "autocobro" (pesar+cobrar en un mismo carrito mixto) vive en el POS normal,
  // no aqui — ver POSPage.tsx, que usa el socket /bascula (kiosk-join) directamente.
  async registrarPesaje(dto: { tienda_id: number; producto_id: number; peso_kg: number }, scope: any) {
    if (!dto.peso_kg || dto.peso_kg <= 0) throw new BadRequestException('Peso invalido');

    const config = await this.getOrCreateConfig(dto.tienda_id, scope);
    if (!config.activo) throw new BadRequestException('La bascula de autoservicio no esta activa en esta tienda');

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

    // En modo 'navegador' la etiqueta la imprime el propio kiosko en la impresora
    // predeterminada de Windows; no se manda al bridge para no imprimirla dos veces.
    const porNavegador = config.printer_modo === 'navegador';
    if (!porNavegador) {
      this.gateway.emitPrintLabel(dto.tienda_id, {
        producto_nombre: producto.nombre,
        peso_kg: dto.peso_kg,
        precio_total: precioTotal,
        barcode,
        label_width_mm: config.label_width_mm,
        label_height_mm: config.label_height_mm,
        printer_ip: config.printer_ip,
        printer_port: config.printer_port,
      });
    }

    this.logger.log(`Pesaje registrado: ${producto.nombre} ${dto.peso_kg}kg = $${precioTotal} (${barcode})${porNavegador ? ' — imprime el kiosko' : ''}`);

    return {
      producto_nombre: producto.nombre,
      peso_kg: dto.peso_kg,
      precio_total: precioTotal,
      barcode,
      log_id: log.id,
      // El kiosko necesita esto para armar la etiqueta cuando le toca imprimirla a el.
      printer_modo: config.printer_modo || 'red',
      precio_kg: Number(producto.precio),
      label_width_mm: config.label_width_mm,
      label_height_mm: config.label_height_mm,
    };
  }
}
