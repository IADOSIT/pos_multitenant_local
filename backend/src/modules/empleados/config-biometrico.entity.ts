import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('config_biometrico')
export class ConfigBiometrico {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) empresa_id: number;
  @Column() tenant_id: number;
  // Token secreto — bridge lo usa para autenticarse; también en URL de pantalla live
  @Column({ length: 100 }) empresa_token: string;
  @Column({ default: true }) activo: boolean;
  // Stub para torniquete futuro: cuando open_device_enabled=true, el bridge abrirá el relay
  @Column({ default: false }) open_device_enabled: boolean;
  @Column({ type: 'varchar', length: 200, nullable: true }) device_ip: string | null;
  @Column({ type: 'int', nullable: true }) device_timer_s: number | null;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
