import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      const configs = await this.cfgRepo.find({
        where: { is_active: true },
      });

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
    let orders: any[];

    try {
      const res = await fetch(`${base}/orders/${cfg.slug}`, {
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
        this.logger.log(`Pedido Worker recibido: mesa ${order.mesa_numero} tienda ${cfg.tienda_id}`);
      } catch (e) {
        this.logger.warn(`No se pudo insertar pedido ${order.id}: ${e.message}`);
      }

      // ACK siempre — incluso si la inserción falló (evitar loop infinito)
      try {
        await fetch(`${base}/orders/${cfg.slug}/${order.id}/ack`, {
          method: 'POST',
          headers: { 'x-api-key': cfg.api_key },
        });
      } catch {
        // ignorar error de ACK
      }
    }
  }
}
