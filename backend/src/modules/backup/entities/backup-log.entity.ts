import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('backup_logs')
export class BackupLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  tipo: string; // 'db' | 'excel' | 'auto'

  @Column({ length: 500 })
  archivo: string;

  @Column({ type: 'bigint', nullable: true })
  tamano_bytes: number;

  @Column({ length: 20, default: 'ok' })
  estado: string; // 'ok' | 'error'

  @Column({ type: 'text', nullable: true })
  error_msg: string;

  @Column({ default: false })
  onedrive_copiado: boolean;

  @Column({ default: false })
  sftp_subido: boolean;

  @Column({ type: 'text', nullable: true })
  sftp_error: string;

  @CreateDateColumn()
  created_at: Date;
}
