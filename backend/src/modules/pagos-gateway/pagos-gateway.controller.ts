import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { PagosGatewayService } from './pagos-gateway.service';

@Controller('pagos-gateway')
@UseGuards(AuthGuard('jwt'))
export class PagosGatewayController {
  constructor(private readonly service: PagosGatewayService) {}

  @Get('config')
  getConfig(@TenantScope('tienda_id') tiendaId: number) {
    return this.service.getConfig(tiendaId);
  }

  @Put('config')
  saveConfig(@Body() body: any, @TenantScope('tienda_id') tiendaId: number) {
    return this.service.saveConfig(tiendaId, body);
  }

  // MercadoPago QR
  @Post('mp/qr')
  crearQrMP(@Body() body: any, @TenantScope('tienda_id') tiendaId: number) {
    return this.service.crearQrMP(tiendaId, body);
  }

  @Get('mp/estado/:external_id')
  getEstadoMP(@Param('external_id') externalId: string, @TenantScope('tienda_id') tiendaId: number) {
    return this.service.getEstadoMP(tiendaId, externalId);
  }

  // MercadoPago Point
  @Post('mp/point')
  crearPointMP(@Body() body: any, @TenantScope('tienda_id') tiendaId: number) {
    return this.service.crearPointMP(tiendaId, body);
  }

  @Get('mp/point/:intent_id')
  getEstadoPoint(@Param('intent_id') intentId: string, @TenantScope('tienda_id') tiendaId: number) {
    return this.service.getEstadoPoint(tiendaId, intentId);
  }

  // Stripe
  @Post('stripe/intent')
  crearStripeIntent(@Body() body: any, @TenantScope('tienda_id') tiendaId: number) {
    return this.service.crearStripeIntent(tiendaId, body);
  }

  @Get('stripe/estado/:intent_id')
  getEstadoStripe(@Param('intent_id') intentId: string, @TenantScope('tienda_id') tiendaId: number) {
    return this.service.getEstadoStripe(tiendaId, intentId);
  }

  // Transacciones
  @Get('transacciones')
  getTransacciones(@Query('limit') limit: string, @TenantScope('tienda_id') tiendaId: number) {
    return this.service.getTransacciones(tiendaId, limit ? parseInt(limit) : 50);
  }
}

// Webhook endpoints — no JWT auth required (called by MP/Stripe)
@Controller('pagos-gateway/webhook')
export class PagosGatewayWebhookController {
  constructor(private readonly service: PagosGatewayService) {}

  @Post('mp')
  webhookMP(@Body() body: any) {
    return this.service.webhookMP(body);
  }

  @Post('stripe')
  webhookStripe(@Body() body: any) {
    return this.service.webhookStripe(body);
  }
}
