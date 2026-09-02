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

  @Column({ nullable: true })
  usuario_id: number;

  @Column({ length: 50 })
  folio: string;

  // Numero de orden visible para el personal: el mismo consecutivo que ya lleva el
  // folio, pero como entero para poder mostrarlo corto ("#70") y compararlo de un
  // vistazo. El folio se conserva intacto como llave de trazabilidad (tickets,
  // apartados, devoluciones), asi que nada de lo que lo consume cambia.
  @Column({ default: 0 })
  numero_orden: number;

  @Column({ nullable: true, default: 0 })
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

  @Column({ length: 20, nullable: true })
  cliente_telefono: string;

  @Column({ length: 300, nullable: true })
  cliente_direccion: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  cliente_email: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  cliente_empresa: string | null;

  @Column({ nullable: true })
  venta_id: number;

  @Column({ length: 100, nullable: true })
  usuario_nombre: string;

  @Column({ default: false })
  self_order: boolean;

  @Column({ nullable: true })
  mesero_id: number;

  @Column({ length: 200, nullable: true })
  mesero_nombre: string;

  @Column({ default: false })
  mesero_confirmado: boolean;

  @Column({ length: 100, nullable: true })
  encuesta_token: string;

  @Column({ length: 20, default: 'en_sitio' })
  tipo_servicio: string; // 'en_sitio' | 'para_llevar'

  @Column({ default: false })
  cuenta_abierta: boolean;

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
