"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const schema_sync_service_1 = require("./common/services/schema-sync.service");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const fs_1 = require("fs");
const typeorm_config_1 = require("./config/typeorm.config");
const tenant_scope_middleware_1 = require("./common/middleware/tenant-scope.middleware");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const empresas_module_1 = require("./modules/empresas/empresas.module");
const tiendas_module_1 = require("./modules/tiendas/tiendas.module");
const productos_module_1 = require("./modules/productos/productos.module");
const categorias_module_1 = require("./modules/categorias/categorias.module");
const ventas_module_1 = require("./modules/ventas/ventas.module");
const caja_module_1 = require("./modules/caja/caja.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const tickets_module_1 = require("./modules/tickets/tickets.module");
const print_module_1 = require("./modules/print/print.module");
const health_module_1 = require("./modules/health/health.module");
const pedidos_module_1 = require("./modules/pedidos/pedidos.module");
const notificaciones_module_1 = require("./modules/notificaciones/notificaciones.module");
const licencias_module_1 = require("./modules/licencias/licencias.module");
const inventario_module_1 = require("./modules/inventario/inventario.module");
const materia_prima_module_1 = require("./modules/materia-prima/materia-prima.module");
const menu_digital_module_1 = require("./modules/menu-digital/menu-digital.module");
const backup_module_1 = require("./modules/backup/backup.module");
const mesas_module_1 = require("./modules/mesas/mesas.module");
const self_order_module_1 = require("./modules/self-order/self-order.module");
const encuestas_module_1 = require("./modules/encuestas/encuestas.module");
const pagos_gateway_module_1 = require("./modules/pagos-gateway/pagos-gateway.module");
const perfiles_module_1 = require("./modules/perfiles/perfiles.module");
const _distProd = (0, path_1.join)(process.cwd(), '..', 'frontend', 'dist-prod');
const _staticRoot = (0, fs_1.existsSync)(_distProd)
    ? _distProd
    : (0, path_1.join)(__dirname, '..', 'public');
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(tenant_scope_middleware_1.TenantScopeMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                ...typeorm_config_1.dataSourceOptions,
                autoLoadEntities: true,
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: _staticRoot,
                exclude: ['/api/(.*)'],
            }),
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            empresas_module_1.EmpresasModule,
            tiendas_module_1.TiendasModule,
            productos_module_1.ProductosModule,
            categorias_module_1.CategoriasModule,
            ventas_module_1.VentasModule,
            caja_module_1.CajaModule,
            dashboard_module_1.DashboardModule,
            tickets_module_1.TicketsModule,
            print_module_1.PrintModule,
            notificaciones_module_1.NotificacionesModule,
            pedidos_module_1.PedidosModule,
            licencias_module_1.LicenciasModule,
            inventario_module_1.InventarioModule,
            materia_prima_module_1.MateriaPrimaModule,
            menu_digital_module_1.MenuDigitalModule,
            backup_module_1.BackupModule,
            mesas_module_1.MesasModule,
            self_order_module_1.SelfOrderModule,
            encuestas_module_1.EncuestasModule,
            pagos_gateway_module_1.PagosGatewayModule,
            perfiles_module_1.PerfilesModule,
        ],
        providers: [schema_sync_service_1.SchemaSyncService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map