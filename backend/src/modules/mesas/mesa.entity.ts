import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mesas')
@Index(['tenant_id', 'empresa_id', 'tienda_id'])
export class Mesa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() tenant_id: number;
  @Column() empresa_id: number;
  @Column() tienda_id: number;

  @Column() numero: number;

  @Column({ length: 100, nullable: true })
  nombre: string;

  @Column({ length: 100, nullable: true })
  zona: string;

  @Column({ default: 4 })
  capacidad: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}

@Entity('mesa_asignaciones')
@Index(['tienda_id'])
export class MesaAsignacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() mesa_id: number;
  @Column() tienda_id: number;
  @Column() tenant_id: number;
  @Column() empresa_id: number;
  @Column() user_id: number;

  @Column({ length: 200, nullable: true })
  user_nombre: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn() created_at: Date;
}

@Entity('mesas_juntas')
@Index(['tienda_id'])
export class MesaJunta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() mesa_principal_id: number;
  @Column() mesa_secundaria_id: number;
  @Column() tienda_id: number;
  @Column() tenant_id: number;
  @Column() empresa_id: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn() created_at: Date;
}
