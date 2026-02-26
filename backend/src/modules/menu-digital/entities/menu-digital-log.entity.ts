import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('menu_digital_log')
@Index(['tienda_id'])
export class MenuDigitalLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tienda_id: number;

  @Column()
  tenant_id: number;

  @Column({ default: 0 })
  productos_count: number;

  @Column({ default: 0 })
  images_uploaded: number;

  @Column({ length: 20 })
  status: string; // 'success' | 'error'

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ default: 0 })
  duration_ms: number;

  @CreateDateColumn()
  created_at: Date;
}
