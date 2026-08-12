import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('ecommerce_config')
@Index(['empresa_id'], { unique: true })
@Index(['subdominio'], { unique: true })
export class EcommerceConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empresa_id: number;

  @Column()
  tenant_id: number;

  @Column({ default: false })
  activo: boolean;

  @Column({ length: 63, nullable: true })
  subdominio: string;

  @Column({ length: 255, nullable: true })
  nombre_tienda: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 7, default: '#1e40af' })
  color_primario: string;

  @Column({ length: 7, default: '#0f172a' })
  color_secundario: string;

  @Column({ type: 'text', nullable: true })
  banner_url: string;

  @Column({ type: 'text', nullable: true })
  politica_envio: string;

  @Column({ type: 'text', nullable: true })
  terminos: string;

  @Column({ type: 'text', nullable: true })
  mensaje_mayoreo: string;

  @Column({ default: false })
  modo_mayoreo: boolean;

  @Column({ default: 10 })
  qty_min_mayoreo: number;

  @Column({ length: 20, default: 'lumina' })
  tema_id: string;

  // Preferencias configurables de la tienda (JSON flexible, sin más columnas):
  // { promociones: { activo, texto }, envio_gratis: { activo, umbral } }
  @Column({ type: 'json', nullable: true })
  preferencias: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
