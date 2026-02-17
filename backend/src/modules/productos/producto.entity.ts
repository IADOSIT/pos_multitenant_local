import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';

@Entity('productos')
@Index(['tenant_id', 'empresa_id'])
@Index(['sku', 'tenant_id', 'empresa_id'])
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column({ length: 50 })
  sku: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 500, nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costo: number;

  @Column({ nullable: true })
  categoria_id: number;

  @Column({ length: 500, nullable: true })
  imagen_url: string;

  @Column({ length: 50, nullable: true })
  codigo_barras: string;

  @Column({ length: 20, nullable: true })
  unidad: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  impuesto_pct: number;

  @Column({ default: true })
  disponible: boolean;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: false })
  controla_stock: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stock_actual: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  stock_minimo: number;

  @Column({ default: 0 })
  orden: number;

  @Column({ type: 'json', nullable: true })
  modificadores: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Categoria, (c) => c.productos)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @OneToMany(() => ProductoTienda, (pt) => pt.producto)
  tiendas: ProductoTienda[];
}

@Entity('producto_tienda')
@Index(['tenant_id', 'tienda_id', 'producto_id'])
export class ProductoTienda {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  tienda_id: number;

  @Column()
  producto_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_local: number;

  @Column({ default: true })
  disponible: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stock: number;

  @ManyToOne(() => Producto, (p) => p.tiendas)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;
}
