import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Producto } from '../productos/producto.entity';

@Entity('categorias')
@Index(['tenant_id', 'empresa_id'])
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 500, nullable: true })
  descripcion: string;

  @Column({ length: 500, nullable: true })
  imagen_url: string;

  @Column({ length: 20, nullable: true })
  color: string;

  @Column({ length: 50, nullable: true })
  icono: string;

  @Column({ default: 0 })
  orden: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: false })
  es_seccion_especial: boolean;

  @Column({ length: 50, nullable: true })
  tipo_seccion: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Producto, (p) => p.categoria)
  productos: Producto[];
}
