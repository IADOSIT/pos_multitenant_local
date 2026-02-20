import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CAJERO = 'cajero',
  MESERO = 'mesero',
}

@Entity('users')
@Index(['tenant_id', 'empresa_id'])
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  tenant_id: number;

  @Column({ nullable: true })
  empresa_id: number;

  @Column({ nullable: true })
  tienda_id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CAJERO })
  rol: UserRole;

  @Column({ length: 20, nullable: true })
  pin: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'datetime', nullable: true })
  ultimo_login: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant, (t) => t.users)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
