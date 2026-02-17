import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('auditoria')
@Index(['tenant_id', 'created_at'])
@Index(['entidad', 'entidad_id'])
export class Auditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column({ nullable: true })
  empresa_id: number;

  @Column({ nullable: true })
  tienda_id: number;

  @Column()
  usuario_id: number;

  @Column({ length: 100 })
  usuario_nombre: string;

  @Column({ length: 50 })
  accion: string;

  @Column({ length: 50 })
  entidad: string;

  @Column({ nullable: true })
  entidad_id: number;

  @Column({ type: 'json', nullable: true })
  datos_anteriores: any;

  @Column({ type: 'json', nullable: true })
  datos_nuevos: any;

  @Column({ length: 50, nullable: true })
  ip: string;

  @CreateDateColumn()
  created_at: Date;
}
