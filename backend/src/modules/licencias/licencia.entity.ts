import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum LicenciaPlan {
  BASICO = 'basico',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum LicenciaEstado {
  TRIAL = 'trial',
  ACTIVA = 'activa',
  SUSPENDIDA = 'suspendida',
  EXPIRADA = 'expirada',
}

@Entity('licencias')
export class Licencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column({ unique: true })
  codigo_instalacion: string;

  @Column({ type: 'text', nullable: true })
  codigo_activacion: string;

  @Column({ default: LicenciaPlan.BASICO })
  plan: string;

  @Column({ type: 'json', nullable: true })
  features: string[];

  @Column({ default: 1 })
  max_tiendas: number;

  @Column({ default: 3 })
  max_usuarios: number;

  @Column({ type: 'date', nullable: true })
  fecha_inicio: string;

  @Column({ type: 'date', nullable: true })
  fecha_fin: string;

  @Column({ default: 15 })
  grace_days: number;

  @Column({ default: true })
  offline_allowed: boolean;

  @Column({ default: LicenciaEstado.TRIAL })
  estado: string;

  @Column({ type: 'timestamp', nullable: true })
  activated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_heartbeat: Date;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
