import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('devoluciones')
@Index(['tenant_id', 'empresa_id', 'tienda_id'])
@Index(['venta_id'])
export class Devolucion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_id: number;

  @Column()
  venta_id: number;

  @Column({ length: 50 })
  folio: string;

  @Column({ length: 50 })
  venta_folio: string;

  @Column()
  usuario_id: number;

  @Column({ length: 200 })
  usuario_nombre: string;

  @Column({ length: 500, nullable: true })
  motivo: string;

  @Column({ type: 'json' })
  items: {
    producto_id: number;
    nombre: string;
    sku: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto_total: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
