import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Tienda } from '../tiendas/tienda.entity';

@Entity('empresas')
@Index(['tenant_id'])
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 200, nullable: true })
  razon_social: string;

  @Column({ length: 20, nullable: true })
  rfc: string;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 500, nullable: true })
  logo_url: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant, (t) => t.empresas)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => Tienda, (t) => t.empresa)
  tiendas: Tienda[];
}
