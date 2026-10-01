import { Module } from '@nestjs/common';
import { MantenimientoService } from './mantenimiento.service';
import { MantenimientoController } from './mantenimiento.controller';

/**
 * No necesita entidades: trabaja contra el disco y los scripts del
 * instalador, no contra el ORM.
 */
@Module({
  controllers: [MantenimientoController],
  providers: [MantenimientoService],
  exports: [MantenimientoService],
})
export class MantenimientoModule {}
