import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('config_logistica')
export class ConfigLogistica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  empresa_id: number;

  @Column()
  tenant_id: number;

  // Habilita el módulo de logística para esta empresa
  @Column({ default: false })
  modulo_habilitado: boolean;

  // Fase 1: siempre false. Fase 2: admin activa con sus credenciales.
  @Column({ default: false })
  notif_whatsapp_enabled: boolean;

  @Column({ type: 'text', nullable: true })
  notif_whatsapp_token: string;

  @Column({ length: 30, nullable: true })
  notif_whatsapp_numero: string;

  @Column({ length: 20, nullable: true })
  notif_proveedor: string;

  @Column({ type: 'text', nullable: true })
  msg_asignado: string;

  @Column({ type: 'text', nullable: true })
  msg_en_camino: string;

  @Column({ type: 'text', nullable: true })
  msg_entregado: string;

  @Column({ type: 'text', nullable: true })
  msg_con_problema: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
