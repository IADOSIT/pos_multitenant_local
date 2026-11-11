import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Liquidacion de un repartidor: el dinero que entrega en caja por un grupo de pedidos.
 *
 * Es un registro de control, NO un movimiento de caja: la venta ya cuenta en el corte
 * desde que se cobro, asi que sumarla otra vez duplicaria el efectivo esperado.
 * No se edita ni se borra (trazabilidad).
 */
@Entity('repartidor_liquidaciones')
@Index(['tenant_id', 'tienda_id', 'created_at'])
@Index(['repartidor_id'])
export class RepartidorLiquidacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_id: number;

  @Column()
  repartidor_id: number;

  @Column({ type: 'varchar', length: 100 })
  repartidor_nombre: string;

  // Caja abierta en el momento (solo referencia para cuadrar el turno).
  @Column({ type: 'int', nullable: true })
  caja_id: number | null;

  // total = liquido todo lo que traia; parcial = solo algunos pedidos.
  @Column({ type: 'varchar', length: 10, default: 'total' })
  tipo: string;

  @Column({ type: 'int', default: 0 })
  num_pedidos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_vendido: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  efectivo_esperado: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  efectivo_recibido: number;

  // recibido - esperado: negativo = faltante, positivo = sobrante.
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  diferencia: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notas: string | null;

  @Column({ type: 'int', nullable: true })
  usuario_id: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  usuario_nombre: string | null;

  @CreateDateColumn()
  created_at: Date;
}
