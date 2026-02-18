import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('ticket_configs')
@Index(['tenant_id', 'empresa_id', 'tienda_id'])
export class TicketConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column({ nullable: true })
  empresa_id: number;

  @Column({ nullable: true })
  tienda_id: number;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ length: 200, nullable: true })
  encabezado_linea1: string;

  @Column({ length: 200, nullable: true })
  encabezado_linea2: string;

  @Column({ length: 200, nullable: true })
  encabezado_linea3: string;

  @Column({ length: 500, nullable: true })
  pie_linea1: string;

  @Column({ length: 500, nullable: true })
  pie_linea2: string;

  @Column({ type: 'int', default: 80 })
  ancho_papel: number;

  @Column({ type: 'int', default: 42 })
  columnas: number;

  @Column({ default: true })
  mostrar_logo: boolean;

  @Column({ default: true })
  mostrar_fecha: boolean;

  @Column({ default: true })
  mostrar_cajero: boolean;

  @Column({ default: true })
  mostrar_folio: boolean;

  @Column({ default: false })
  mostrar_marca_iados: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
