import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('materia_prima')
@Index(['tenant_id', 'empresa_id'])
@Index(['sku', 'tenant_id', 'empresa_id'])
export class MateriaPrima {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column({ nullable: true })
  tienda_id: number;

  @Column({ length: 50 })
  sku: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 500, nullable: true })
  descripcion?: string;

  @Column({ length: 100, nullable: true })
  categoria?: string;

  @Column({ length: 20, default: 'pza' })
  unidad: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stock_actual: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stock_minimo: number;

  @Column({ length: 200, nullable: true })
  proveedor?: string;

  @Column({ length: 500, nullable: true })
  notas?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
