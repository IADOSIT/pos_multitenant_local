import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';

export enum VentaEstado {
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  PENDIENTE = 'pendiente',
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  MIXTO = 'mixto',
}

@Entity('ventas')
@Index(['tenant_id', 'empresa_id', 'tienda_id'])
@Index(['tenant_id', 'created_at'])
@Index(['folio', 'tenant_id'])
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  tienda_id: number;

  @Column()
  caja_id: number;

  @Column()
  usuario_id: number;

  @Column({ length: 50 })
  folio: string;

  @Column({ length: 50, nullable: true })
  folio_offline: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  impuestos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: MetodoPago, default: MetodoPago.EFECTIVO })
  metodo_pago: MetodoPago;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pago_efectivo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pago_tarjeta: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pago_transferencia: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cambio: number;

  @Column({ type: 'enum', enum: VentaEstado, default: VentaEstado.COMPLETADA })
  estado: VentaEstado;

  @Column({ length: 500, nullable: true })
  notas: string;

  @Column({ length: 200, nullable: true })
  cliente_nombre: string;

  @Column({ default: false })
  sincronizado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => VentaDetalle, (d) => d.venta, { cascade: true })
  detalles: VentaDetalle[];

  @OneToMany(() => VentaPago, (p) => p.venta, { cascade: true })
  pagos: VentaPago[];
}

@Entity('venta_detalles')
@Index(['venta_id'])
export class VentaDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  venta_id: number;

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

  @ManyToOne(() => Venta, (v) => v.detalles)
  venta: Venta;
}

@Entity('venta_pagos')
@Index(['venta_id'])
export class VentaPago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  venta_id: number;

  @Column({ type: 'enum', enum: MetodoPago })
  metodo: MetodoPago;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ length: 100, nullable: true })
  referencia: string;

  @ManyToOne(() => Venta, (v) => v.pagos)
  venta: Venta;
}
