import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * Codigo que lleva impreso el gafete QR del repartidor (Control de Repartidores).
 *
 * Vive en su propia tabla a proposito: asi no se altera `repartidores` (de Logistica) y,
 * si algun dia se revierte el modulo, synchronize no borra ninguna columna existente.
 * No es secreto (el `token` de Logistica SI lo es, porque abre la pagina publica del
 * repartidor): solo identifica al repartidor al escanearlo en caja.
 *
 * Unicidad dentro del tenant: la garantiza el servicio, no un indice UNIQUE.
 */
@Entity('repartidor_qr')
@Index(['tenant_id', 'codigo'])
@Index(['repartidor_id'])
export class RepartidorQr {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  repartidor_id: number;

  @Column({ type: 'varchar', length: 20 })
  codigo: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
