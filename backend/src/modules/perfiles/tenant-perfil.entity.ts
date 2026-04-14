import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('tenant_perfiles')
@Index(['tenant_id'])
export class TenantPerfil {
  @PrimaryGeneratedColumn() id: number;
  @Column() tenant_id: number;
  @Column({ length: 50 }) perfil_clave: string;
  @Column({ type: 'json', nullable: true }) config_override: any;
  @Column({ default: true }) activo: boolean;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
