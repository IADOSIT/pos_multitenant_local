import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum ApartadoEstado {
  PENDIENTE = 'pendiente',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

// Reserva de stock: se cobra en tienda_origen (donde el producto NO tenia stock local) y se
// recoge/entrega en tienda_destino (la que si tenia stock y ya se lo descontamos al pagar).
@Entity('apartados_inventario')
@Index(['tenant_id', 'empresa_id'])
@Index(['tienda_destino_id', 'estado'])
@Index(['folio'])
export class ApartadoInventario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_origen_id: number;

  @Column()
  tienda_destino_id: number;

  @Column({ nullable: true })
  venta_id: number;

  @Column({ length: 30 })
  folio: string;

  @Column()
  producto_id: number;

  @Column({ length: 200 })
  producto_nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ length: 150, nullable: true })
  cliente_nombre: string;

  @Column({ length: 20, nullable: true })
  cliente_telefono: string;

  @Column({ length: 20, default: ApartadoEstado.PENDIENTE })
  estado: ApartadoEstado;

  @Column({ nullable: true })
  usuario_creo_id: number;

  @Column({ length: 100, nullable: true })
  usuario_creo_nombre: string;

  @Column({ nullable: true })
  usuario_entrego_id: number;

  @Column({ length: 100, nullable: true })
  usuario_entrego_nombre: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  entregado_at: Date;
}
