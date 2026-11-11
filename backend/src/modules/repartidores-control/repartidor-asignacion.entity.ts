import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * Pedido (venta ya cobrada en caja) que se lleva un repartidor.
 *
 * Guarda una foto de la venta al momento de asignarla (folio, productos, importe, cliente)
 * para que el historial no cambie aunque despues se edite el catalogo. El estado de la
 * venta (por ejemplo, si luego se cancela) se consulta en vivo contra `ventas`.
 *
 * Estados:
 *  - pendiente  : el repartidor la trae y todavia no la liquida.
 *  - liquidada  : ya entrego el dinero (ver `liquidacion_id`).
 *  - reasignada : se paso a otro repartidor (queda el renglon nuevo).
 *  - cancelada  : se quito la asignacion (con motivo y usuario).
 */
@Entity('repartidor_asignaciones')
@Index(['tenant_id', 'tienda_id', 'estado'])
@Index(['repartidor_id', 'estado'])
@Index(['venta_id'])
@Index(['liquidacion_id'])
export class RepartidorAsignacion {
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

  @Column()
  venta_id: number;

  @Column({ type: 'int', nullable: true })
  pedido_id: number | null;

  @Column({ type: 'varchar', length: 50 })
  folio: string;

  @Column({ type: 'int', nullable: true })
  numero_orden: number | null;

  @Column({ type: 'text', nullable: true })
  productos: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  cliente_nombre: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  cliente_direccion: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  metodo_pago: string | null;

  // Efectivo que el repartidor debe entregar: el mismo calculo del corte de caja
  // (pago_efectivo - cambio). Tarjeta/transferencia = 0.
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  efectivo: number;

  @Column({ type: 'datetime', nullable: true })
  fecha_venta: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado: string;

  // escaner | lista | sin_internet | reasignacion
  @Column({ type: 'varchar', length: 20, default: 'escaner' })
  origen: string;

  @Column({ type: 'int', nullable: true })
  asignado_por_id: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  asignado_por_nombre: string | null;

  @Column({ type: 'int', nullable: true })
  liquidacion_id: number | null;

  // Quien la cerro (liquido, reasigno o quito) y por que.
  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo: string | null;

  @Column({ type: 'int', nullable: true })
  cerrado_por_id: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cerrado_por_nombre: string | null;

  @Column({ type: 'datetime', nullable: true })
  cerrado_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
