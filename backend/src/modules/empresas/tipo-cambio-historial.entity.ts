import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('tipo_cambio_historial')
@Index(['empresa_id', 'created_at'])
export class TipoCambioHistorial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empresa_id: number;

  @Column({ length: 10 })
  codigo: string; // 'USD'

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  tipo_cambio: number;

  @Column({ length: 20 })
  origen: 'manual' | 'automatico';

  @CreateDateColumn()
  created_at: Date;
}
