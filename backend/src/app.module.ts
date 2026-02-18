import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { dataSourceOptions } from './config/typeorm.config';
import { TenantScopeMiddleware } from './common/middleware/tenant-scope.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { TiendasModule } from './modules/tiendas/tiendas.module';
import { ProductosModule } from './modules/productos/productos.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { CajaModule } from './modules/caja/caja.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { PrintModule } from './modules/print/print.module';
import { HealthModule } from './modules/health/health.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { LicenciasModule } from './modules/licencias/licencias.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { MateriaPrimaModule } from './modules/materia-prima/materia-prima.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    EmpresasModule,
    TiendasModule,
    ProductosModule,
    CategoriasModule,
    VentasModule,
    CajaModule,
    DashboardModule,
    TicketsModule,
    PrintModule,
    NotificacionesModule,
    PedidosModule,
    LicenciasModule,
    InventarioModule,
    MateriaPrimaModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantScopeMiddleware).forRoutes('*');
  }
}
