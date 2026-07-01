import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('empleados')
@Index(['tenant_id', 'empresa_id'])
export class Empleado {
  @PrimaryGeneratedColumn() id: number;
  @Column() tenant_id: number;
  @Column() empresa_id: number;
  @Column({ length: 100 }) nombre: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) apellido: string | null;
  @Column({ type: 'varchar', length: 80, nullable: true }) cargo: string | null;
  @Column({ type: 'varchar', length: 60, nullable: true }) departamento: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) telefono: string | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) imagen_url: string | null;
  // Template FMD ANSI 378 base64 (~500 bytes) — null si no se ha enrolado
  @Column({ type: 'text', nullable: true }) fmd_template: string | null;
  @Column({ type: 'datetime', nullable: true }) fmd_enrolled_at: Date | null;
  @Column({ default: true }) activo: boolean;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
