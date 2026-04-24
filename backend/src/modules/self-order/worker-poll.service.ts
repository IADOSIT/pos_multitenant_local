import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MenuDigitalConfig } from '../menu-digital/entities/menu-digital-config.entity';
import { SelfOrderService } from './self-order.service';

@Injectable()
export class WorkerPollService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('WorkerPollService');
  private timer: ReturnType<typeof setInterval> | null = null;
  private polling = false;

  constructor(
    @InjectRepository(MenuDigitalConfig) private cfgRepo: Repository<MenuDigitalConfig>,
    private selfOrderService: SelfOrderService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => this.poll(), 3000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll() {
    if (this.polling) return;
    this.polling = true;
    try {
      const configs = await this.cfgRepo.find({ where: { is_active: true } });
      for (const cfg of configs) {
        if (!cfg.worker_url || !cfg.api_key) continue;
        await this.pollOne(cfg);
      }
    } catch (e) {
      this.logger.error('Error en ciclo de polling: ' + e.message);
    } finally {
      this.polling = false;
    }
  }

  private async pollOne(cfg: MenuDigitalConfig) {
    const base = cfg.worker_url.replace(/\/$/, '');

    // Collect all slugs to poll: cfg.slug + tienda.slug (QR mesas usa tienda.slug)
    const slugsToPoll = new Set<string>([cfg.slug]);
    try {
      const [tienda] = await this.dataSource.query(
        'SELECT slug FROM tiendas WHERE id = ?',
        [cfg.tienda_id],
      );
      if (tienda?.slug && tienda.slug !== cfg.slug) {
        slugsToPoll.add(tienda.slug);
      }
    } catch {}

    for (const slug of slugsToPoll) {
      await this.pollSlug(cfg, base, slug);
    }
  }

  private async pollSlug(cfg: MenuDigitalConfig, base: string, slug: string) {
    let orders: any[];
    try {
      const res = await fetch(`${base}/orders/${slug}`, {
        headers: { 'x-api-key': cfg.api_key },
      });
      if (!res.ok) return;
      orders = await res.json();
    } catch {
      return; // Worker unreachable — sin internet, ignorar
    }

    if (!orders?.length) return;

    for (const order of orders) {
      try {
        const body = {
          cliente_nombre: order.cliente_nombre || 'Cliente',
          items: order.items,
          subtotal: order.total,
          total: order.total,
          notas: order.notas || null,
        };
        await this.selfOrderService.crearPedidoCliente(cfg.tienda_id, order.mesa_numero, body);
        this.logger.log(`Pedido Worker recibido: mesa ${order.mesa_numero} tienda ${cfg.tienda_id} slug=${slug}`);
      } catch (e) {
        this.logger.warn(`No se pudo insertar pedido ${order.id} (slug=${slug}): ${e.message}`);
      }

      // ACK siempre — incluso si la inserción falló (evitar loop infinito)
      try {
        await fetch(`${base}/orders/${slug}/${order.id}/ack`, {
          method: 'POST',
          headers: { 'x-api-key': cfg.api_key },
        });
      } catch {}
    }
  }
}
