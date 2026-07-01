import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empleado } from './empleado.entity';
import { HorarioEmpleado } from './horario-empleado.entity';
import { RegistroAsistencia } from './registro-asistencia.entity';
import { ConfigBiometrico } from './config-biometrico.entity';
import { EmpleadosService } from './empleados.service';
import { AsistenciaService } from './asistencia.service';
import { BiometricoService } from './biometrico.service';
import { BiometricoGateway } from './biometrico.gateway';
import { EmpleadosController } from './empleados.controller';
import { BiometricoPublicController } from './biometrico-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Empleado, HorarioEmpleado, RegistroAsistencia, ConfigBiometrico])],
  controllers: [EmpleadosController, BiometricoPublicController],
  providers: [EmpleadosService, AsistenciaService, BiometricoService, BiometricoGateway],
  exports: [EmpleadosService, AsistenciaService],
})
export class EmpleadosModule {}
