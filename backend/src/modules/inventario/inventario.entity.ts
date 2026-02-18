import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum MovimientoTipo {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
  DEVOLUCION = 'devolucion',
}

@Entity('movimientos_inventario')
@Index(['tenant_id', 'empresa_id', 'tienda_id'])
@Index(['producto_id'])
export class MovimientoInventario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_id: number;

  @Column()
  producto_id: number;

  @Column({ length: 200 })
  producto_nombre: string;

  @Column({ length: 50 })
  producto_sku: string;

  @Column({ type: 'enum', enum: MovimientoTipo })
  tipo: MovimientoTipo;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  stock_anterior: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  stock_nuevo: number;

  @Column({ length: 500, nullable: true })
  concepto?: string;

  @Column()
  usuario_id: number;

  @Column({ length: 100 })
  usuario_nombre: string;

  @CreateDateColumn()
  created_at: Date;
}
