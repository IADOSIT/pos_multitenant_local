import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('menu_digital_orders')
@Index(['slug', 'status'])
@Index(['tienda_id', 'status'])
export class MenuDigitalOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  slug: string;

  @Column()
  tienda_id: number;

  @Column()
  tenant_id: number;

  @Column({ length: 10 })
  numero_orden: string; // e.g. "001", "042"

  @Column({ length: 100, nullable: true })
  cliente_nombre: string;

  @Column({ length: 30, nullable: true })
  mesa_numero: string;

  @Column({ type: 'json' })
  items: any; // [{ producto_id, nombre, precio, cantidad, subtotal, notas }]

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ length: 20, default: 'pending' })
  status: string; // 'pending' | 'received' | 'completed' | 'cancelled'

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
