import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MonitorGateway } from './monitor.gateway';
import { MonitorService } from './monitor.service';

// AuthModule se importa por el JwtService, que ya exporta. No hay TypeOrmModule
// aqui: este modulo no toca la base de datos.
@Module({
  imports: [AuthModule],
  providers: [MonitorGateway, MonitorService],
})
export class MonitorModule {}
