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
  //   'usb'       → etiquetadora conectada por USB a la PC del bridge (Brother QL-800
  //                 y cualquier otra con driver de Windows). No hay IP ni ZPL: el
  //                 bridge arma la misma etiqueta y la manda por el driver, en
  //                 silencio, a la cola de esa impresora por nombre.
  @Column({ type: 'varchar', length: 20, default: 'red' }) printer_modo: string;

  // Impresora de etiquetas (recomendado: ZPL en red, socket TCP crudo al puerto 9100)
  @Column({ type: 'varchar', length: 100, nullable: true }) printer_ip: string | null;
  // Nombre EXACTO de la impresora en Windows, solo para printer_modo='usb'. Es un dato
  // de la PC, no de la nube: si el bridge trae ETIQUETA_IMPRESORA en su config local,
  // esa gana. Este campo sirve para configurarla sin ir a la caja.
  @Column({ type: 'varchar', length: 150, nullable: true }) printer_nombre: string | null;
  @Column({ type: 'int', default: 9100 }) printer_port: number;
  // Etiqueta adherible estandar 50 x 25 mm (2" x 1"), horizontal: el lado largo es
  // el ancho porque el EAN-13 se imprime a lo largo.
  @Column({ type: 'int', default: 50 }) label_width_mm: number;
  @Column({ type: 'int', default: 25 }) label_height_mm: number;

  // ── Cajon de dinero ──
  // Vive aqui y no en una tabla nueva porque esta tabla ya es "la configuracion del
  // hardware local de la tienda": el mismo bridge que lee la bascula es el que manda
  // el pulso al cajon, y se autentica con el mismo tienda_token.
  // Apagado por defecto: ninguna tienda existente cambia de comportamiento.
  @Column({ default: false }) cajon_activo: boolean;

  // Cuando se abre solo:
  //   'efectivo' → solo si el cobro incluyo efectivo (lo normal)
  //   'siempre'  → en todo cobro, sin importar la forma de pago
  //   'manual'   → nunca solo; unicamente con el boton del POS
  @Column({ type: 'varchar', length: 20, default: 'efectivo' }) cajon_abrir_en: string;

  // Abrir el cajon fuera de una venta mueve dinero sin registro. Con esto encendido,
  // el boton manual del POS pide el PIN del usuario antes de mandar el pulso.
  @Column({ default: false }) cajon_pedir_pin: boolean;

  // Bascula por serial (RS-232/USB) — el protocolo exacto se ajusta segun el modelo comprado
  @Column({ type: 'varchar', length: 30, nullable: true }) scale_port: string | null;
  @Column({ type: 'int', default: 9600 }) scale_baud_rate: number;
  @Column({ type: 'varchar', length: 20, default: 'generic' }) scale_protocol: string;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
