import { Controller, Get, Post, Param, Body, ParseIntPipe, UseGuards, Req, Res, Query } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { SelfOrderService } from './self-order.service';

// Endpoints públicos (sin auth) — accedidos por el cliente desde su celular
@Controller('public/self-order')
export class SelfOrderPublicController {
  constructor(private service: SelfOrderService) {}

  @Get('s/:slug/:mesa_numero')
  getTiendaBySlug(
    @Param('slug') slug: string,
    @Param('mesa_numero', ParseIntPipe) mesa_numero: number,
  ) {
    return this.service.getTiendaPublicaBySlug(slug, mesa_numero);
  }

  @Get('s/:slug/menu/productos')
  getMenuBySlug(@Param('slug') slug: string) {
    return this.service.getMenuPublicoBySlug(slug);
  }

  @Post('s/:slug/:mesa_numero/pedido')
  crearPedidoBySlug(
    @Param('slug') slug: string,
    @Param('mesa_numero', ParseIntPipe) mesa_numero: number,
    @Body() body: any,
  ) {
    return this.service.crearPedidoBySlug(slug, mesa_numero, body);
  }

  @Get(':tienda_id/:mesa_numero')
  getTiendaPublica(
    @Param('tienda_id', ParseIntPipe) tienda_id: number,
    @Param('mesa_numero', ParseIntPipe) mesa_numero: number,
  ) {
    return this.service.getTiendaPublica(tienda_id, mesa_numero);
  }

  @Get(':tienda_id/menu/productos')
  getMenuPublico(@Param('tienda_id', ParseIntPipe) tienda_id: number) {
    return this.service.getMenuPublico(tienda_id);
  }

  @Post(':tienda_id/:mesa_numero/pedido')
  crearPedido(
    @Param('tienda_id', ParseIntPipe) tienda_id: number,
    @Param('mesa_numero', ParseIntPipe) mesa_numero: number,
    @Body() body: any,
  ) {
    return this.service.crearPedidoCliente(tienda_id, mesa_numero, body);
  }

  @Get('status/:token')
  getEstado(@Param('token') token: string) {
    return this.service.getEstadoPedido(token);
  }

  @Post('encuesta/:token')
  responderEncuesta(@Param('token') token: string, @Body() body: any) {
    return this.service.responderEncuesta(token, body);
  }

  @Get('qr/:tienda_id/:mesa_id')
  async printQR(
    @Param('tienda_id', ParseIntPipe) tienda_id: number,
    @Param('mesa_id', ParseIntPipe) mesa_id: number,
    @Query('base') baseParam: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Usar baseUrl del frontend (contiene la IP real de la red) o fallback al host del request
    const baseUrl = baseParam ? decodeURIComponent(baseParam) : `${req.protocol}://${req.get('host')}`;
    const html = await this.service.getQRPrintable(tienda_id, mesa_id, baseUrl);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}

// Endpoints protegidos — usados por mesero/admin en el POS
@Controller('self-order')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SelfOrderController {
  constructor(private service: SelfOrderService) {}

  @Post('pedidos/:id/confirmar')
  confirmarPedido(@Param('id', ParseIntPipe) id: number, @TenantScope() scope) {
    return this.service.confirmarPedidoMesero(id, scope);
  }

  @Post('pedidos/:id/rechazar')
  rechazarPedido(@Param('id', ParseIntPipe) id: number, @Body() body: { motivo: string }, @TenantScope() scope) {
    return this.service.rechazarPedido(id, body.motivo || 'Sin motivo', scope);
  }

  @Get('kpis')
  getKPIs(@TenantScope() scope, @Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.service.getKPIs(scope, desde, hasta);
  }
}
