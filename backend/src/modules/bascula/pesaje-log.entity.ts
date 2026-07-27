import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// Solo auditoria/reportes de lo pesado — NO afecta inventario (el stock se descuenta
// normal al cobrarse la venta en caja, igual que cualquier otro producto).
@Entity('pesaje_logs')
@Index(['tienda_id', 'created_at'])
export class PesajeLog {
  @PrimaryGeneratedColumn() id: number;

  @Column() tenant_id: number;
  @Column() empresa_id: number;
  @Column() tienda_id: number;

  @Column() producto_id: number;
  @Column({ length: 150 }) producto_nombre: string;

  @Column({ type: 'decimal', precision: 8, scale: 3 }) peso_kg: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 }) precio_total: number;

  @Column({ length: 13 }) barcode: string;

  // Solo en modo autocobro: liga el pesaje a la venta que se registro al cobrarlo ahi mismo
  @Column({ type: 'int', nullable: true }) venta_id: number | null;

  @CreateDateColumn() created_at: Date;
}
