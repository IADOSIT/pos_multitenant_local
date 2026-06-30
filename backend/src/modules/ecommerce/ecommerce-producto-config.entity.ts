import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('ecommerce_producto_config')
@Index(['producto_id'], { unique: true })
@Index(['tenant_id', 'empresa_id'])
export class EcommerceProductoConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  producto_id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_mayoreo: number;

  @Column({ nullable: true })
  qty_min_mayoreo: number;

  @Column({ default: true })
  visible_ecommerce: boolean;

  @Column({ type: 'text', nullable: true })
  descripcion_larga: string;

  @Column({ type: 'json', nullable: true })
  imagenes_extra: string[];

  @Column({ length: 255, nullable: true })
  slug: string;

  @Column({ type: 'json', nullable: true })
  etiquetas: string[];

  @Column({ default: 0 })
  orden_ecommerce: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
