import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('config_bascula')
export class ConfigBascula {
  @PrimaryGeneratedColumn() id: number;

  @Column({ unique: true }) tienda_id: number;
  @Column() empresa_id: number;
  @Column() tenant_id: number;

  // Habilita el kiosko de autoservicio (ventana aparte): pesa e imprime etiqueta con
  // precio, el cliente paga despues en cualquier caja que escanee la etiqueta.
  @Column({ default: false }) activo: boolean;

  // Habilita la integracion de la bascula dentro del POS normal: al agregar un producto
  // con unidad "kg" en una venta mixta, el cajero pesa ahi mismo y el cobro sigue el
  // flujo normal de POS (PayModal) junto con el resto del carrito.
  @Column({ default: false }) usar_en_pos: boolean;

  // Token secreto — el bridge local (bascula-bridge) lo usa para autenticarse por Socket.io
  @Column({ length: 100 }) tienda_token: string;

  // Como se imprime la etiqueta del kiosko:
  //   'red'       → ZPL por TCP a una etiquetadora en red, lo manda el bridge local
  //   'navegador' → la imprime el propio kiosko en la impresora predeterminada de
  //                 Windows, igual que los tickets del POS (iframe + window.print)
  @Column({ type: 'varchar', length: 20, default: 'red' }) printer_modo: string;

  // Impresora de etiquetas (recomendado: ZPL en red, socket TCP crudo al puerto 9100)
  @Column({ type: 'varchar', length: 100, nullable: true }) printer_ip: string | null;
  @Column({ type: 'int', default: 9100 }) printer_port: number;
  // Etiqueta adherible estandar 50 x 25 mm (2" x 1"), horizontal: el lado largo es
  // el ancho porque el EAN-13 se imprime a lo largo.
  @Column({ type: 'int', default: 50 }) label_width_mm: number;
  @Column({ type: 'int', default: 25 }) label_height_mm: number;

  // Bascula por serial (RS-232/USB) — el protocolo exacto se ajusta segun el modelo comprado
  @Column({ type: 'varchar', length: 30, nullable: true }) scale_port: string | null;
  @Column({ type: 'int', default: 9600 }) scale_baud_rate: number;
  @Column({ type: 'varchar', length: 20, default: 'generic' }) scale_protocol: string;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
