import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('perfiles_negocio')
export class PerfilNegocio {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 50, unique: true }) clave: string;
  @Column({ length: 100 }) nombre: string;
  @Column({ type: 'text', nullable: true }) descripcion: string;
  @Column({ type: 'json', nullable: true }) config: any;
  @Column({ default: true }) activo: boolean;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
