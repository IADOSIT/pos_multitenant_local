import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('encuestas_servicio')
@Index(['tenant_id', 'empresa_id', 'tienda_id'])
@Index(['pedido_id'])
export class EncuestaServicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() pedido_id: number;
  @Column() tenant_id: number;
  @Column() empresa_id: number;
  @Column() tienda_id: number;

  @Column() mesa_numero: number;

  @Column({ nullable: true }) mesero_id: number;

  @Column({ length: 200, nullable: true })
  mesero_nombre: string;

  @Column({ length: 200, nullable: true })
  cliente_nombre: string;

  @Column({ type: 'tinyint', default: 0 })
  calificacion_servicio: number;

  @Column({ type: 'tinyint', default: 0 })
  calificacion_comida: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  comentario: string | null;

  @Column({ default: false })
  completada: boolean;

  @CreateDateColumn()
  created_at: Date;
}
