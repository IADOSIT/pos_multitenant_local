import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('ecommerce_pedidos')
@Index(['empresa_id'])
@Index(['estado'])
@Index(['created_at'])
export class EcommercePedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empresa_id: number;

  @Column()
  tenant_id: number;

  @Column({ length: 20, unique: true })
  numero_pedido: string;

  @Column({ type: 'enum', enum: ['menudeo', 'mayoreo'], default: 'menudeo' })
  tipo_venta: 'menudeo' | 'mayoreo';

  @Column({ length: 255 })
  cliente_nombre: string;

  @Column({ length: 255 })
  cliente_email: string;

  @Column({ length: 20, nullable: true })
  cliente_tel: string;

  @Column({ type: 'json', nullable: true })
  direccion_envio: any;

  @Column({ type: 'json' })
  items: any[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'],
    default: 'pendiente',
  })
  estado: string;

  @Column({ type: 'text', nullable: true })
  notas_cliente: string;

  @Column({ type: 'text', nullable: true })
  notas_internas: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
