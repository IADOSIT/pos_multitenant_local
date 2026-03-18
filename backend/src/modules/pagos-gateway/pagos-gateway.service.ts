import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewayConfig } from './gateway-config.entity';
import { GatewayTransaccion } from './gateway-transaccion.entity';

@Injectable()
export class PagosGatewayService {
  constructor(
    @InjectRepository(GatewayConfig)
    private configRepo: Repository<GatewayConfig>,
    @InjectRepository(GatewayTransaccion)
    private txRepo: Repository<GatewayTransaccion>,
  ) {}

  // ── Config ──────────────────────────────────────────────────────────────────

  async getConfig(tienda_id: number): Promise<any> {
    let config = await this.configRepo.findOne({ where: { tienda_id } });
    if (!config) {
      config = this.configRepo.create({
        tienda_id,
        opciones: {
          mp_qr_habilitado: false,
          mp_point_habilitado: false,
          stripe_habilitado: false,
          confirmacion_automatica: true,
          comision_mp_porcentaje: 3.49,
          comision_stripe_porcentaje: 3.6,
        },
      });
      await this.configRepo.save(config);
    }
    // Mask sensitive keys for display
    const safe = { ...config };
    if (safe.mp_access_token) safe.mp_access_token = this.maskKey(safe.mp_access_token);
    if (safe.mp_public_key) safe.mp_public_key = this.maskKey(safe.mp_public_key);
    if (safe.stripe_secret_key) safe.stripe_secret_key = this.maskKey(safe.stripe_secret_key);
    if (safe.stripe_webhook_secret) safe.stripe_webhook_secret = this.maskKey(safe.stripe_webhook_secret);
    return safe;
  }

  async saveConfig(tienda_id: number, data: any): Promise<GatewayConfig> {
    let config = await this.configRepo.findOne({ where: { tienda_id } });
    if (!config) config = this.configRepo.create({ tienda_id });
    // Only update non-masked fields (masked keys contain '***')
    const fields = ['mp_access_token', 'mp_public_key', 'mp_user_id', 'mp_point_device_id',
      'stripe_secret_key', 'stripe_publishable_key', 'stripe_webhook_secret'];
    for (const f of fields) {
      if (data[f] !== undefined && !data[f].includes('***')) {
        config[f] = data[f] || null;
      }
    }
    if (data.opciones) config.opciones = { ...config.opciones, ...data.opciones };
    if (data.activo !== undefined) config.activo = data.activo;
    return this.configRepo.save(config);
  }

  // ── MercadoPago QR ───────────────────────────────────────────────────────────

  async crearQrMP(tienda_id: number, body: { total: number; folio: string; items?: any[] }): Promise<any> {
    const config = await this.configRepo.findOne({ where: { tienda_id } });
    if (!config?.mp_access_token || config.mp_access_token.includes('***')) {
      throw new BadRequestException('Access token de MercadoPago no configurado');
    }
    if (!config.mp_user_id) {
      throw new BadRequestException('User ID de MercadoPago no configurado');
    }

    const external_id = `POS-${body.folio}-${Date.now()}`;
    const mpBody: any = {
      external_id,
      title: `Venta ${body.folio}`,
      description: 'Punto de Venta iaDoS',
      total_amount: Number(body.total),
      items: (body.items || [{ nombre: `Venta ${body.folio}`, precio: body.total, cantidad: 1 }]).map((i: any) => ({
        sku_number: i.sku || `ITEM`,
        category: 'marketplace',
        title: i.nombre || 'Producto',
        description: i.nombre || 'Producto',
        unit_price: Number(i.precio),
        quantity: Number(i.cantidad),
        unit_measure: 'unit',
        total_amount: Math.round(Number(i.precio) * Number(i.cantidad) * 100) / 100,
      })),
    };

    const res = await fetch(
      `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${config.mp_user_id}/pos/POS_IADOS/qrs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.mp_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mpBody),
      },
    );
    const result = await res.json() as any;
    if (!res.ok) throw new BadRequestException(result.message || result.cause?.[0]?.description || 'Error MP QR');

    const comisionPct = config.opciones?.comision_mp_porcentaje ?? 3.49;
    const comision = Math.round(body.total * comisionPct / 100 * 100) / 100;

    const tx = this.txRepo.create({
      tienda_id,
      gateway: 'mercadopago',
      tipo: 'qr',
      referencia_interna: external_id,
      estado: 'pending',
      monto: body.total,
      comision,
      neto: body.total - comision,
      metadata: result,
    });
    await this.txRepo.save(tx);

    return { qr_data: result.qr_data, external_id, transaccion_id: tx.id };
  }

  async getEstadoMP(tienda_id: number, external_id: string): Promise<any> {
    const config = await this.configRepo.findOne({ where: { tienda_id } });
    if (!config?.mp_access_token || config.mp_access_token.includes('***')) {
      throw new BadRequestException('Config MP incompleta');
    }

    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(external_id)}&sort=date_created&criteria=desc&range=date_created&begin_date=NOW-1DAYS`,
      { headers: { Authorization: `Bearer ${config.mp_access_token}` } },
    );
    const result = await res.json() as any;
    const payment = (result.results || [])[0];

    if (payment) {
      const tx = await this.txRepo.findOne({ where: { referencia_interna: external_id } });
      if (tx && payment.status !== tx.estado) {
        tx.estado = payment.status;
        tx.referencia_gateway = String(payment.id);
        tx.metadata = payment;
        await this.txRepo.save(tx);
      }
      return { estado: payment.status, pago_id: payment.id, monto: payment.transaction_amount };
    }
    return { estado: 'pending' };
  }

  // ── MercadoPago Point ────────────────────────────────────────────────────────

  async crearPointMP(tienda_id: number, body: { total: number; folio: string }): Promise<any> {
    const config = await this.configRepo.findOne({ where: { tienda_id } });
    if (!config?.mp_access_token || config.mp_access_token.includes('***')) {
      throw new BadRequestException('Access token MP no configurado');
    }
    if (!config.mp_point_device_id) {
      throw new BadRequestException('Device ID de MP Point no configurado');
    }

    const external_reference = `POS-${body.folio}-${Date.now()}`;
    const res = await fetch(
      `https://api.mercadopago.com/point/integration-api/devices/${config.mp_point_device_id}/payment-intents`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.mp_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(body.total),
          description: `Venta ${body.folio}`,
          additional_info: { external_reference },
        }),
      },
    );
    const result = await res.json() as any;
    if (!res.ok) throw new BadRequestException(result.message || 'Error MP Point');

    const comisionPct = config.opciones?.comision_mp_porcentaje ?? 3.49;
    const comision = Math.round(body.total * comisionPct / 100 * 100) / 100;

    const tx = this.txRepo.create({
      tienda_id,
      gateway: 'mercadopago',
      tipo: 'point',
      referencia_gateway: result.id,
      referencia_interna: external_reference,
      estado: 'pending',
      monto: body.total,
      comision,
      neto: body.total - comision,
      metadata: result,
    });
    await this.txRepo.save(tx);

    return { intent_id: result.id, external_reference, transaccion_id: tx.id };
  }

  async getEstadoPoint(tienda_id: number, intent_id: string): Promise<any> {
    const config = await this.configRepo.findOne({ where: { tienda_id } });
    if (!config?.mp_access_token || config.mp_access_token.includes('***')) {
      throw new BadRequestException('Config MP incompleta');
    }

    const res = await fetch(
      `https://api.mercadopago.com/point/integration-api/payment-intents/${intent_id}`,
      { headers: { Authorization: `Bearer ${config.mp_access_token}` } },
    );
    const result = await res.json() as any;

    // OPEN | ON_TERMINAL | PROCESSING | PROCESSED | CANCELED
    const estadoMap: Record<string, string> = {
      PROCESSED: 'approved',
      CANCELED: 'cancelled',
      OPEN: 'pending',
      ON_TERMINAL: 'processing',
      PROCESSING: 'processing',
    };
    const estado = estadoMap[result.state] || result.state?.toLowerCase() || 'pending';

    const tx = await this.txRepo.findOne({ where: { referencia_gateway: intent_id } });
    if (tx && estado !== 'pending' && estado !== tx.estado) {
      tx.estado = estado;
      tx.metadata = result;
      await this.txRepo.save(tx);
    }

    return { estado, state: result.state, payment_id: result.payment?.id };
  }

  // ── Stripe ───────────────────────────────────────────────────────────────────

  async crearStripeIntent(tienda_id: number, body: { total: number; folio: string }): Promise<any> {
    const config = await this.configRepo.findOne({ where: { tienda_id } });
    if (!config?.stripe_secret_key || config.stripe_secret_key.includes('***')) {
      throw new BadRequestException('Clave secreta de Stripe no configurada');
    }

    const amountCents = Math.round(body.total * 100);
    const params = new URLSearchParams();
    params.append('amount', String(amountCents));
    params.append('currency', 'mxn');
    params.append('payment_method_types[]', 'card');
    params.append('description', `Venta ${body.folio}`);
    params.append('metadata[folio]', body.folio);
    params.append('metadata[tienda_id]', String(tienda_id));

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.stripe_secret_key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const result = await res.json() as any;
    if (!res.ok) throw new BadRequestException(result.error?.message || 'Error Stripe');

    const comisionPct = config.opciones?.comision_stripe_porcentaje ?? 3.6;
    const comision = Math.round(body.total * comisionPct / 100 * 100) / 100;

    const tx = this.txRepo.create({
      tienda_id,
      gateway: 'stripe',
      tipo: 'card',
      referencia_gateway: result.id,
      referencia_interna: `POS-${body.folio}`,
      estado: 'pending',
      monto: body.total,
      comision,
      neto: body.total - comision,
      metadata: result,
    });
    await this.txRepo.save(tx);

    return {
      client_secret: result.client_secret,
      intent_id: result.id,
      publishable_key: config.stripe_publishable_key,
      transaccion_id: tx.id,
    };
  }

  async getEstadoStripe(tienda_id: number, intent_id: string): Promise<any> {
    const config = await this.configRepo.findOne({ where: { tienda_id } });
    if (!config?.stripe_secret_key || config.stripe_secret_key.includes('***')) {
      throw new BadRequestException('Config Stripe incompleta');
    }

    const res = await fetch(`https://api.stripe.com/v1/payment_intents/${intent_id}`, {
      headers: { Authorization: `Bearer ${config.stripe_secret_key}` },
    });
    const result = await res.json() as any;

    const estadoMap: Record<string, string> = {
      succeeded: 'approved',
      canceled: 'cancelled',
      requires_payment_method: 'pending',
      processing: 'processing',
    };
    const estado = estadoMap[result.status] || result.status || 'pending';

    const tx = await this.txRepo.findOne({ where: { referencia_gateway: intent_id } });
    if (tx && estado !== 'pending' && estado !== tx.estado) {
      tx.estado = estado;
      tx.metadata = result;
      await this.txRepo.save(tx);
    }

    return { estado, status: result.status };
  }

  // ── Webhooks ─────────────────────────────────────────────────────────────────

  async webhookMP(payload: any): Promise<void> {
    if (payload.type === 'payment' && payload.data?.id) {
      const tx = await this.txRepo.findOne({ where: { referencia_gateway: String(payload.data.id) } });
      if (tx) {
        const estadoMap: Record<string, string> = {
          'payment.created': 'approved',
          'payment.updated': 'approved',
        };
        tx.estado = estadoMap[payload.action] || payload.action || tx.estado;
        tx.metadata = { ...tx.metadata, webhook: payload };
        await this.txRepo.save(tx);
      }
    }
  }

  async webhookStripe(payload: any): Promise<void> {
    if (payload.type === 'payment_intent.succeeded') {
      const intentId = payload.data?.object?.id;
      if (intentId) {
        const tx = await this.txRepo.findOne({ where: { referencia_gateway: intentId } });
        if (tx) {
          tx.estado = 'approved';
          tx.metadata = { ...tx.metadata, webhook: payload };
          await this.txRepo.save(tx);
        }
      }
    }
  }

  // ── Transactions ─────────────────────────────────────────────────────────────

  async getTransacciones(tienda_id: number, limit = 50): Promise<GatewayTransaccion[]> {
    return this.txRepo.find({
      where: { tienda_id },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private maskKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return key.substring(0, 6) + '***' + key.substring(key.length - 4);
  }
}
