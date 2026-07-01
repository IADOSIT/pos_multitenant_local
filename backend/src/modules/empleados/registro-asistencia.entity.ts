import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum EstadoAsistencia {
  PUNTUAL = 'puntual',
  TARDE = 'tarde',
  SIN_HORARIO = 'sin_horario',
}

@Entity('registros_asistencia')
@Index(['empleado_id', 'fecha'])
@Index(['tenant_id', 'empresa_id', 'fecha'])
export class RegistroAsistencia {
  @PrimaryGeneratedColumn() id: number;
  @Column() empleado_id: number;
  @Column() tenant_id: number;
  @Column() empresa_id: number;
  @Column({ length: 200 }) empleado_nombre: string;
  @Column({ type: 'date' }) fecha: string;
  @Column({ type: 'datetime' }) timestamp_entrada: Date;
  @Column({ type: 'varchar', length: 20, default: 'biometrico' }) tipo: string; // 'biometrico' | 'manual'
  @Column({ type: 'enum', enum: EstadoAsistencia, default: EstadoAsistencia.SIN_HORARIO })
  estado: EstadoAsistencia;
  @Column({ type: 'int', nullable: true }) minutos_tarde: number | null;
  @Column({ type: 'text', nullable: true }) notas: string | null;
  @CreateDateColumn() created_at: Date;
}
