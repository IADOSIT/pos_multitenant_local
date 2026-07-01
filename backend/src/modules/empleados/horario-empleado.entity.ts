import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('horarios_empleados')
@Index(['empleado_id'])
export class HorarioEmpleado {
  @PrimaryGeneratedColumn() id: number;
  @Column() empleado_id: number;
  @Column() empresa_id: number;
  @Column() tenant_id: number;
  @Column() dia_semana: number; // 0=Dom 1=Lun 2=Mar 3=Mie 4=Jue 5=Vie 6=Sab
  @Column({ type: 'varchar', length: 5 }) hora_entrada: string; // 'HH:MM'
  @Column({ default: 10 }) tolerancia_minutos: number;
  @Column({ default: true }) activo: boolean;
}
