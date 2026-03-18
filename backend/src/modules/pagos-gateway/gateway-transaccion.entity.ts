import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('gateway_transacciones')
@Index(['tienda_id', 'created_at'])
export class GatewayTransaccion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tienda_id: number;

  @Column({ nullable: true })
  venta_id: number;

  @Column({ nullable: true })
  pedido_id: number;

  @Column({ length: 50 })
  gateway: string; // 'mercadopago' | 'stripe'

  @Column({ length: 50 })
  tipo: string; // 'qr' | 'point' | 'card'

  @Column({ length: 200, nullable: true })
  referencia_gateway: string; // MP payment_id or Stripe payment_intent_id

  @Column({ length: 200, nullable: true })
  referencia_interna: string; // our POS-{folio} reference

  @Column({ length: 50, default: 'pending' })
  estado: string; // 'pending' | 'approved' | 'rejected' | 'cancelled'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  comision: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  neto: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
