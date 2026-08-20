import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum TransferenciaEstado {
  PENDIENTE = 'pendiente',
  RECIBIDO = 'recibido',
  CANCELADO = 'cancelado',
}

// Movimiento directo de stock de una tienda a otra (misma empresa): se descuenta de
// tienda_origen al crear y se suma a tienda_destino hasta que esta confirma recepcion.
@Entity('transferencias_inventario')
@Index(['tenant_id', 'empresa_id'])
@Index(['tienda_destino_id', 'estado'])
@Index(['tienda_origen_id'])
@Index(['folio'])
export class TransferenciaInventario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_origen_id: number;

  @Column({ length: 150, nullable: true })
  tienda_origen_nombre: string;

  @Column()
  tienda_destino_id: number;

  @Column({ length: 150, nullable: true })
  tienda_destino_nombre: string;

  @Column({ length: 30 })
  folio: string;

  @Column()
  producto_id: number;

  @Column({ length: 200 })
  producto_nombre: string;

  @Column({ length: 50, nullable: true })
  producto_sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ length: 500, nullable: true })
  notas: string;

  @Column({ length: 20, default: TransferenciaEstado.PENDIENTE })
  estado: TransferenciaEstado;

  @Column({ nullable: true })
  usuario_envio_id: number;

  @Column({ length: 100, nullable: true })
  usuario_envio_nombre: string;

  @Column({ nullable: true })
  usuario_recibio_id: number;

  @Column({ length: 100, nullable: true })
  usuario_recibio_nombre: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  recibido_at: Date;
}
