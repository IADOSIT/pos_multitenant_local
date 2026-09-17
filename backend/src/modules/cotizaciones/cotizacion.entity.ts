import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type CotizacionEstado =
  | 'solicitada'   // el cliente mando su lista, todavia sin precios
  | 'enviada'      // hay una version con precios esperando respuesta
  | 'aceptada'     // terminal: de aqui en adelante manda el pedido
  | 'rechazada'    // el cliente dijo que no, con motivo. Se puede re-cotizar
  | 'vencida'      // se paso la vigencia sin respuesta. Se puede re-cotizar
  | 'cerrada';     // el negocio la dio por perdida

// El consecutivo COT-YY-NNNN se genera POR EMPRESA, asi que la unicidad tambien.
// Un UNIQUE global chocaria con el COT-26-0001 de otra tienda (el mismo error que
// ya se corrigio en ecommerce_pedidos).
@Entity('cotizaciones')
@Index(['empresa_id', 'numero'], { unique: true })
@Index(['empresa_id', 'estado'])
@Index(['estado', 'pedido_id'])
@Index(['created_at'])
export class Cotizacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empresa_id: number;

  @Column()
  tenant_id: number;

  @Column({ type: 'int', nullable: true })
  cliente_id: number | null;

  @Column({ length: 20 })
  numero: string;

  @Column({ length: 255 })
  cliente_nombre: string;

  @Column({ length: 255, default: '' })
  cliente_email: string;

  @Column({ length: 20, nullable: true })
  cliente_tel: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  cliente_empresa: string | null;

  @Column({ type: 'json', nullable: true })
  direccion_envio: any;

  @Column({ type: 'text', nullable: true })
  notas_cliente: string | null;

  @Column({
    type: 'enum',
    enum: ['solicitada', 'enviada', 'aceptada', 'rechazada', 'vencida', 'cerrada'],
    default: 'solicitada',
  })
  estado: CotizacionEstado;

  // 0 = solicitada, sin cotizar todavia. Denormalizacion deliberada: evita un
  // MAX(version) en cada renglon del tablero.
  @Column({ type: 'int', default: 0 })
  version_actual: number;

  // Sucursal que cobrara. Se fija al enviar la v1: cuando el cliente acepte, ya no
  // habra un operador en sesion de quien deducirla.
  @Column({ type: 'int', nullable: true })
  tienda_id: number | null;

  // Pedido de mostrador materializado al aceptar el cliente.
  @Column({ type: 'int', nullable: true })
  pedido_id: number | null;

  @Column({ type: 'text', nullable: true })
  notas_internas: string | null;

  @Column({ type: 'text', nullable: true })
  motivo_cierre: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
