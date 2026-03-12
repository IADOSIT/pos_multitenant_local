import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('backup_configs')
export class BackupConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  auto_backup_enabled: boolean;

  @Column({ length: 5, default: '02:00' })
  auto_backup_hora: string;

  @Column({ type: 'int', default: 7 })
  retencion_dias: number;

  @Column({ default: true })
  incluir_db: boolean;

  @Column({ default: true })
  incluir_excel: boolean;

  @Column({ default: false })
  onedrive_enabled: boolean;

  @Column({ length: 500, nullable: true })
  onedrive_carpeta: string;

  @Column({ type: 'datetime', nullable: true })
  ultimo_backup_at: Date;

  @Column({ length: 20, nullable: true })
  ultimo_backup_estado: string;
}
