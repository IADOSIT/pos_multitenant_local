import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
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
      'activo', 'usar_en_pos', 'printer_modo', 'printer_ip', 'printer_port', 'printer_nombre',
      'label_width_mm', 'label_height_mm',
      'scale_port', 'scale_baud_rate', 'scale_protocol',
      'cajon_activo', 'cajon_abrir_en', 'cajon_pedir_pin',
    ];
    for (const key of allowed) {
      if ((dto as any)[key] !== undefined) (config as any)[key] = (dto as any)[key];
    }
    return this.configRepo.save(config);
  }

  /**
   * Pide al bridge de esa tienda que mande el pulso al cajon (camino por la nube).
   * El camino preferido es el puente local del propio equipo; este es el respaldo.
   */
  async abrirCajon(tiendaId: number, scope: any): Promise<{ ok: boolean; via: string }> {
    const config = await this.getOrCreateConfig(tiendaId, scope);
    if (!config.cajon_activo) {
      throw new BadRequestException('El cajon de dinero no esta activado para esta tienda');
    }
    this.gateway.emitOpenDrawer(tiendaId);
    this.logger.log(`Cajon: pulso solicitado por la nube para tienda ${tiendaId}`);
    return { ok: true, via: 'nube' };
  }

  /**
   * Instalador del bridge listo para bajar.
   *
   * Se guarda UN solo .exe (subido una vez por el superadmin) y se entrega renombrado
   * con el token de la tienda: `...__TKN-<token>.exe`. El instalador lee su propio
   * nombre y deja la tienda configurada sola — ver bascula-bridge/installer.nsh.
   */
  rutaInstalador(): string | null {
    // uploads/ es la carpeta autoritativa (bind mount del host: ahi puede quedar un
    // .exe subido a mano, mas nuevo que el del repo). uploads/downloads es la
    // historica — el link viejo de Configuracion apuntaba ahi — y uploads/bridge se
    // acepta como alternativa por si alguien lo deja en esa.
    const preferidas = [
      join(process.cwd(), 'uploads', 'downloads'),
      join(process.cwd(), 'uploads', 'bridge'),
    ];
    // uploads-builtin es la copia que el Dockerfile hornea DENTRO de la imagen desde
    // el repo (COPY uploads ./uploads-builtin). Es el respaldo que salva el caso real
    // que se vio en produccion: el .exe se servia por /api/uploads (existia en la
    // imagen) pero el bind mount del host no lo tenia, asi que esto devolvia null y
    // la descarga daba 404 con el archivo ya publicado. Va al final, nunca antes que
    // uploads/, para no tapar un instalador subido a mano.
    const respaldo = [
      join(process.cwd(), 'uploads-builtin', 'downloads'),
      join(process.cwd(), 'uploads-builtin', 'bridge'),
    ];

    // Gana el .exe mas reciente. A proposito no se prefiere el nombre historico
    // (bascula-bridge-setup.exe): en los servidores que ya existen ese archivo es la
    // version vieja, sin cajon y sin el token en el nombre, y preferirlo entregaria
    // justo el instalador equivocado.
    const buscar = (dirs: string[]): string | null => {
      const exes: { ruta: string; t: number }[] = [];
      for (const dir of dirs) {
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir)) {
          if (!f.toLowerCase().endsWith('.exe')) continue;
          const ruta = join(dir, f);
          exes.push({ ruta, t: statSync(ruta).mtimeMs });
        }
      }
      if (!exes.length) return null;
      exes.sort((a, b) => b.t - a.t);
      return exes[0].ruta;
    };

    const ruta = buscar(preferidas) || buscar(respaldo);
    if (!ruta) {
      // Sin esto, un 404 no distingue "no se subio" de "se subio y no lo encuentra".
      // Queda en los logs del contenedor (Portainer), que es lo unico visible sin SSH.
      const detalle = [...preferidas, ...respaldo]
        .map((d) => `${d}: ${existsSync(d) ? readdirSync(d).join('|') || '(vacia)' : 'no existe'}`)
        .join(' || ');
      console.warn('[bridge] No hay instalador .exe publicado. ' + detalle);
    }
    return ruta;
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
        // El modo 'usb' arma la etiqueta con el mismo formato que el navegador, y ahi
        // si se imprime "peso x precio/kg": por eso el precio por kilo viaja tambien.
        precio_kg: Number(producto.precio),
        barcode,
        label_width_mm: config.label_width_mm,
        label_height_mm: config.label_height_mm,
        // El bridge decide con esto si manda ZPL por TCP o por la cola de Windows.
        printer_modo: config.printer_modo || 'red',
        printer_ip: config.printer_ip,
        printer_port: config.printer_port,
        printer_nombre: config.printer_nombre,
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
