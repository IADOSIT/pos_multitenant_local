import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// Control de versión/despliegue centralizado en BD (no depende de la máquina de build).
// Fila única (id = 1): guarda la versión desplegada y el estado del despliegue.
@Entity('app_deploy')
export class AppDeploy {
  @PrimaryColumn()
  id: number; // siempre 1

  @Column({ length: 50, default: '' })
  version: string;

  @Column({ type: 'enum', enum: ['en_progreso', 'completada'], default: 'completada' })
  estado: 'en_progreso' | 'completada';

  @Column({ type: 'varchar', length: 255, nullable: true })
  mensaje: string | null;

  @UpdateDateColumn()
  updated_at: Date;
}
