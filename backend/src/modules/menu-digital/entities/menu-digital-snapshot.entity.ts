import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('menu_digital_snapshot')
@Unique('UQ_mds_slug', ['slug'])
export class MenuDigitalSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  slug: string;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_id: number;

  @Column({ length: 20, default: 'consulta' })
  modo_menu: string;

  @Column({ length: 20, default: 'oscuro' })
  plantilla: string; // 'oscuro' | 'claro' | 'mar'

  @Column({ default: true })
  is_active: boolean;

  // Copia de la config al publicar: el menu publico solo lee del snapshot.
  @Column({ default: false })
  cantidades_enabled: boolean;

  @Column({ length: 100, default: '10,25,50,100' })
  cantidades_rapidas: string;

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
