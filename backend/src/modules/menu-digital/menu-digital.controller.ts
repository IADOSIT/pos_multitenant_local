import { Controller, Get, Post, Put, Patch, Param, Body, Headers, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MenuDigitalService } from './menu-digital.service';

@Controller('menu-digital')
export class MenuDigitalController {
  constructor(private readonly service: MenuDigitalService) {}

  // =========================================================================
  // Authenticated endpoints (admin/manager)
  // =========================================================================

  @UseGuards(AuthGuard('jwt'))
  @Get('config/:tienda_id')
  getStatus(@Param('tienda_id', ParseIntPipe) tiendaId: number, @Request() req: any) {
    return this.service.getStatus(tiendaId, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('config/:tienda_id')
  updateConfig(
    @Param('tienda_id', ParseIntPipe) tiendaId: number,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.service.updateConfig(tiendaId, dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('config/:tienda_id/regenerate-key')
  regenerateKey(@Param('tienda_id', ParseIntPipe) tiendaId: number, @Request() req: any) {
    return this.service.regenerateApiKey(tiendaId, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('publish/:tienda_id')
  async publish(@Param('tienda_id', ParseIntPipe) tiendaId: number, @Request() req: any) {
    try {
      return await this.service.publish(tiendaId, req.user);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('logs/:tienda_id')
  getLogs(@Param('tienda_id', ParseIntPipe) tiendaId: number) {
    return this.service.getLogs(tiendaId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('orders/:tienda_id')
  getPendingOrders(
    @Param('tienda_id', ParseIntPipe) tiendaId: number,
    @Headers('x-api-key') apiKey: string,
  ) {
    return this.service.getPendingOrders(tiendaId, apiKey);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('orders/:order_id/status')
  updateOrderStatus(
    @Param('order_id', ParseIntPipe) orderId: number,
    @Body() dto: { status: string; tienda_id: number },
  ) {
    return this.service.updateOrderStatus(orderId, dto.status, dto.tienda_id);
  }

  // =========================================================================
  // Cloud receive endpoints (API key auth, called by local backends)
  // =========================================================================

  @Post('receive')
  receive(@Body() dto: any) {
    return this.service.receiveSnapshot(dto);
  }

  @Post('receive-image')
  receiveImage(@Body() dto: any) {
    return this.service.receiveImage(dto);
  }

  // Returns the server's own backend and frontend URLs (for UI config suggestions)
  @UseGuards(AuthGuard('jwt'))
  @Get('server-info')
  getServerInfo() {
    return this.service.getServerInfo();
  }

  // =========================================================================
  // Public endpoints (no auth)
  // =========================================================================

  @Get('view/:slug')
  getPublicMenu(@Param('slug') slug: string) {
    return this.service.getPublicMenu(slug);
  }

  @Post('view/:slug/order')
  createOrder(@Param('slug') slug: string, @Body() dto: any) {
    return this.service.createOrder(slug, dto);
  }
}
