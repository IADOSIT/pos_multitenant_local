import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum EstadoEntrega {
  ASIGNADO = 'asignado',
  EN_CAMINO = 'en_camino',
  ENTREGADO = 'entregado',
  CON_PROBLEMA = 'con_problema',
}

@Entity('entregas_pedido')
@Index(['tenant_id', 'empresa_id'])
@Index(['pedido_id'])
@Index(['repartidor_id', 'estado'])
export class EntregaPedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_id: number;

  @Column()
  pedido_id: number;

  @Column()
  repartidor_id: number;

  @Column({ length: 100 })
  repartidor_nombre: string;

  @Column({ length: 60 })
  pedido_folio: string;

  @Column({ length: 200, nullable: true })
  cliente_nombre: string;

  @Column({ length: 20, nullable: true })
  cliente_telefono: string;

  @Column({ length: 300, nullable: true })
  cliente_direccion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'enum', enum: EstadoEntrega, default: EstadoEntrega.ASIGNADO })
  estado: EstadoEntrega;

  @Column({ type: 'text', nullable: true })
  notas_repartidor: string;

  @Column({ type: 'datetime', nullable: true })
  entregado_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
