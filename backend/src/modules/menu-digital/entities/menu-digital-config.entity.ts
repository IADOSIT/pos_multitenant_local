import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('menu_digital_config')
@Index(['tenant_id', 'empresa_id'])
export class MenuDigitalConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column({ unique: true })
  tienda_id: number;

  @Column({ length: 120, unique: true })
  slug: string;

  @Column({ default: false })
  is_active: boolean;

  @Column({ length: 20, default: 'consulta' })
  modo_menu: string; // 'consulta' | 'pedidos'

  @Column({ length: 20, default: 'manual' })
  sync_mode: string; // 'manual' | 'auto'

  @Column({ default: 30 })
  sync_interval: number; // minutos: 15, 30, 60, 120

  @Column({ length: 500, nullable: true })
  cloud_url: string; // e.g. http://34.71.132.26:3000

  @Column({ length: 100, nullable: true })
  api_key: string;

  @Column({ nullable: true })
  last_published_at: Date;

  @Column({ length: 20, nullable: true })
  last_publish_status: string; // 'success' | 'error'

  @Column({ type: 'text', nullable: true })
  last_publish_error: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
