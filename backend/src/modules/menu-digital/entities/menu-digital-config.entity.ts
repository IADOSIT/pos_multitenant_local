import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('menu_digital_config')
@Index('IDX_mdc_tenant_empresa', ['tenant_id', 'empresa_id'])
@Unique('UQ_mdc_tienda', ['tienda_id'])
@Unique('UQ_mdc_slug', ['slug'])
export class MenuDigitalConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_id: number;

  @Column({ length: 120 })
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

  @Column({ length: 20, default: 'oscuro' })
  plantilla: string; // 'oscuro' | 'claro' | 'mar'

  @Column({ type: 'text', nullable: true })
  last_publish_error: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
