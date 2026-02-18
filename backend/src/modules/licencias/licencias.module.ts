import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Licencia } from './licencia.entity';
import { LicenciasService } from './licencias.service';
import { LicenciasController } from './licencias.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Licencia])],
  controllers: [LicenciasController],
  providers: [LicenciasService],
  exports: [LicenciasService],
})
export class LicenciasModule {}
