import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('log_notif_entregas')
@Index(['tenant_id', 'empresa_id'])
@Index(['pedido_id'])
export class LogNotifEntrega {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column()
  pedido_id: number;

  @Column({ length: 60 })
  pedido_folio: string;

  @Column({ length: 30 })
  estado_entrega: string;

  @Column({ length: 20, nullable: true })
  destinatario: string | null;

  @Column({ type: 'text', nullable: true })
  mensaje: string;

  @Column({ length: 20, default: 'omitido' })
  status: string;

  @Column({ type: 'text', nullable: true })
  error_msg: string;

  @CreateDateColumn()
  created_at: Date;
}
