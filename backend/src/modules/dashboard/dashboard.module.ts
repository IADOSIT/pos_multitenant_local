import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta, VentaDetalle } from '../ventas/venta.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, VentaDetalle])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
