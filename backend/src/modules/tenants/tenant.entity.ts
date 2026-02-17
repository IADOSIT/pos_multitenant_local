import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Empresa } from '../empresas/empresa.entity';
import { User } from '../users/user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 50, unique: true })
  slug: string;

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

  @OneToMany(() => Empresa, (e) => e.tenant)
  empresas: Empresa[];

  @OneToMany(() => User, (u) => u.tenant)
  users: User[];
}
