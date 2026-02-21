import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('menu_digital_snapshot')
@Index(['slug'])
export class MenuDigitalSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 120 })
  slug: string;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_id: number;

  @Column({ length: 20, default: 'consulta' })
  modo_menu: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'longtext', nullable: true })
  tienda_json: string; // { nombre, direccion, telefono, email, logo_url }

  @Column({ type: 'longtext', nullable: true })
  categorias_json: string; // [{ id, nombre, color, icono, orden }]

  @Column({ type: 'longtext', nullable: true })
  productos_json: string; // [{ id, nombre, descripcion, precio, categoria_id, imagen_url, disponible }]

  @Column({ nullable: true })
  published_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
