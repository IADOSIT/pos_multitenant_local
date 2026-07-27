import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('config_bascula')
export class ConfigBascula {
  @PrimaryGeneratedColumn() id: number;

  @Column({ unique: true }) tienda_id: number;
  @Column() empresa_id: number;
  @Column() tenant_id: number;

  @Column({ default: false }) activo: boolean;

  // Token secreto — el bridge local (bascula-bridge) lo usa para autenticarse por Socket.io
  @Column({ length: 100 }) tienda_token: string;

  // Impresora de etiquetas (recomendado: ZPL en red, socket TCP crudo al puerto 9100)
  @Column({ type: 'varchar', length: 100, nullable: true }) printer_ip: string | null;
  @Column({ type: 'int', default: 9100 }) printer_port: number;
  @Column({ type: 'int', default: 40 }) label_width_mm: number;
  @Column({ type: 'int', default: 30 }) label_height_mm: number;

  // Bascula por serial (RS-232/USB) — el protocolo exacto se ajusta segun el modelo comprado
  @Column({ type: 'varchar', length: 30, nullable: true }) scale_port: string | null;
  @Column({ type: 'int', default: 9600 }) scale_baud_rate: number;
  @Column({ type: 'varchar', length: 20, default: 'generic' }) scale_protocol: string;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
