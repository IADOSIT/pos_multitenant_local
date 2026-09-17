import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export interface CotizacionItem {
  producto_id: number;
  nombre: string;
  sku: string;
  qty: number;
  precio_unitario: number;
  subtotal: number;
}

// Una fila por cada vez que el negocio cotiza. El historial de la negociacion
// vive aqui: la respuesta del cliente pertenece a la version que contesto, no a
// la cotizacion, porque cada version se acepta o se rechaza por separado.
@Entity('cotizacion_versiones')
@Index(['cotizacion_id', 'version'], { unique: true })
export class CotizacionVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cotizacion_id: number;

  @Column({ type: 'int' })
  version: number;

  // Snapshot con nombre y sku: la version enviada debe seguir siendo legible
  // aunque el producto cambie de precio o se borre despues.
  @Column({ type: 'json' })
  items: CotizacionItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'date' })
  vigencia_hasta: string;

  @Column({ type: 'text', nullable: true })
  mensaje_cliente: string | null;

  @Column({ type: 'datetime' })
  enviada_at: Date;

  @Column({ type: 'enum', enum: ['aceptada', 'rechazada'], nullable: true })
  respuesta: 'aceptada' | 'rechazada' | null;

  @Column({ type: 'text', nullable: true })
  respuesta_motivo: string | null;

  @Column({ type: 'datetime', nullable: true })
  respondida_at: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  respondida_ip: string | null;
}
