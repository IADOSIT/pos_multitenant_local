import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('repartidores')
@Index(['tenant_id', 'empresa_id'])
export class Repartidor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 20, nullable: true })
  telefono: string | null;

  @Column({ default: true })
  activo: boolean;

  @Column({ length: 100, unique: true })
  token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
