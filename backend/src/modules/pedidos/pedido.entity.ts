import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';

export enum PedidoEstado {
  RECIBIDO = 'recibido',
  EN_ELABORACION = 'en_elaboracion',
  LISTO_PARA_ENTREGA = 'listo_para_entrega',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

@Entity('pedidos')
@Index(['tenant_id', 'empresa_id', 'tienda_id'])
@Index(['tienda_id', 'estado'])
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_id: number;

  @Column()
  usuario_id: number;

  @Column({ length: 50 })
  folio: string;

  @Column()
  mesa: number;

  @Column({ type: 'enum', enum: PedidoEstado, default: PedidoEstado.RECIBIDO })
  estado: PedidoEstado;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  impuestos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ length: 500, nullable: true })
  notas: string;

  @Column({ length: 200, nullable: true })
  cliente_nombre: string;

  @Column({ nullable: true })
  venta_id: number;

  @Column({ length: 100, nullable: true })
  usuario_nombre: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PedidoDetalle, (d) => d.pedido, { cascade: true })
  detalles: PedidoDetalle[];
}

@Entity('pedido_detalles')
@Index(['pedido_id'])
export class PedidoDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pedido_id: number;

  @Column()
  producto_id: number;

  @Column({ length: 200 })
  producto_nombre: string;

  @Column({ length: 50 })
  producto_sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  impuesto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'json', nullable: true })
  modificadores: any;

  @Column({ length: 500, nullable: true })
  notas: string;

  @ManyToOne(() => Pedido, (p) => p.detalles)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;
}
