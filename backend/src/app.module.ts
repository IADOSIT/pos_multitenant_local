import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SchemaSyncService } from './common/services/schema-sync.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
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
import { DeployModule } from './modules/deploy/deploy.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { LicenciasModule } from './modules/licencias/licencias.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { MateriaPrimaModule } from './modules/materia-prima/materia-prima.module';
import { MenuDigitalModule } from './modules/menu-digital/menu-digital.module';
import { BackupModule } from './modules/backup/backup.module';
import { MesasModule } from './modules/mesas/mesas.module';
import { SelfOrderModule } from './modules/self-order/self-order.module';
import { EncuestasModule } from './modules/encuestas/encuestas.module';
import { PagosGatewayModule } from './modules/pagos-gateway/pagos-gateway.module';
import { PerfilesModule } from './modules/perfiles/perfiles.module';
import { DevolucionesModule } from './modules/devoluciones/devoluciones.module';
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { LogisticaModule } from './modules/logistica/logistica.module';
import { EmpleadosModule } from './modules/empleados/empleados.module';
import { BasculaModule } from './modules/bascula/bascula.module';

// En SERVER LOCAL/EXTERNO: servir desde frontend/dist-prod (build con plantillas).
// En SERVER OFFLINE (exe instalado): dist-prod no existe → cae a backend/public.
const _distProd = join(process.cwd(), '..', 'frontend', 'dist-prod');
const _staticRoot = existsSync(_distProd)
  ? _distProd
  : join(__dirname, '..', 'public');
// Solo cargar ServeStaticModule si el directorio existe (evita interceptar GET en VPS)
const _serveStatic = existsSync(_staticRoot);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    // Solo activo cuando el directorio static existe (modo offline/local)
    // En VPS no existe → se omite → los GET de /api/ llegan a NestJS correctamente
    ...(_serveStatic ? [ServeStaticModule.forRoot({
      rootPath: _staticRoot,
      exclude: ['/api/(.*)'],  // path-to-regexp v0.2.5 (usado por @nestjs/serve-static@4)
    })] : []),
    HealthModule,
    DeployModule,
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
    MenuDigitalModule,
    BackupModule,
    MesasModule,
    SelfOrderModule,
    EncuestasModule,
    PagosGatewayModule,
    PerfilesModule,
    DevolucionesModule,
    EcommerceModule,
    LogisticaModule,
    EmpleadosModule,
    BasculaModule,
  ],
  providers: [SchemaSyncService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantScopeMiddleware).forRoutes('*');
  }
}
