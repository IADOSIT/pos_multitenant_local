import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';

export enum CajaEstado {
  ABIERTA = 'abierta',
  CERRADA = 'cerrada',
}

export enum MovimientoCajaTipo {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
}

@Entity('cajas')
@Index(['tenant_id', 'tienda_id'])
export class Caja {
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
  nombre: string;

  @Column({ type: 'enum', enum: CajaEstado, default: CajaEstado.CERRADA })
  estado: CajaEstado;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fondo_apertura: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_ventas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_entradas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_salidas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_esperado: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_real: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  diferencia: number;

  @Column({ type: 'datetime', nullable: true })
  fecha_apertura: Date;

  @Column({ type: 'datetime', nullable: true })
  fecha_cierre: Date;

  @Column({ length: 500, nullable: true })
  notas_cierre: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => MovimientoCaja, (m) => m.caja, { cascade: true })
  movimientos: MovimientoCaja[];
}

@Entity('movimientos_caja')
@Index(['caja_id'])
export class MovimientoCaja {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  caja_id: number;

  @Column()
  usuario_id: number;

  @Column({ type: 'enum', enum: MovimientoCajaTipo })
  tipo: MovimientoCajaTipo;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ length: 200 })
  concepto: string;

  @Column({ length: 500, nullable: true })
  notas: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Caja, (c) => c.movimientos)
  @JoinColumn({ name: 'caja_id' })
  caja: Caja;
}
