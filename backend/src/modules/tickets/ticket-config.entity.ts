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

  // Tipografia
  @Column({ length: 100, default: 'Consolas' })
  fuente_familia: string;

  @Column({ type: 'int', default: 11 })
  fuente_tamano: number;

  // Logo: 'centro' | 'izquierda'
  @Column({ length: 20, default: 'centro' })
  logo_posicion: string;

  // Copias del ticket de venta (1 o 2)
  @Column({ type: 'int', default: 1 })
  copias: number;

  // Activar/desactivar impresión automática del ticket de venta
  @Column({ default: true })
  impresion_enabled: boolean;

  // Como se envia el ticket a la impresora:
  // 'navegador' = dialogo de impresion del SO (requiere PC con driver instalado)
  // 'rawbt'     = bytes ESC/POS directo via la app RawBT (Android), sin PC ni driver —
  //               usado para operar desde tablet/celular con impresora WiFi/BT/USB.
  @Column({ length: 20, default: 'navegador' })
  modo_impresion: string;

  // Comandera (ticket de orden para cocina/caja/mesero)
  @Column({ default: false })
  comanda_enabled: boolean;

  @Column({ length: 100, nullable: true })
  comanda_header: string; // ej: 'COCINA', 'CAJA', 'BAR', 'ORDEN'

  @Column({ type: 'int', default: 80 })
  comanda_ancho: number;

  @Column({ default: false })
  comanda_auto_print: boolean; // auto-imprimir al enviar pedido

  @Column({ default: true })
  comanda_mostrar_precio: boolean;

  @Column({ type: 'int', default: 1 })
  comanda_copias: number;

  // Pre-cuenta
  @Column({ default: false })
  precuenta_enabled: boolean;

  // Propina opcional
  @Column({ default: false })
  propina_enabled: boolean;

  @Column({ length: 50, default: '10,15,20' })
  propina_porcentajes: string;

  @Column({ default: true })
  propina_en_ticket: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
