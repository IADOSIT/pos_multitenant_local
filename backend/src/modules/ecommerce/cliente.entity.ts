import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// Identidad minima del cliente de la tienda en linea. Nace para poder listar
// su historial de pedidos por correo (sin cuenta/password) y queda preparada
// para crecer a facturacion (razon_social/rfc) sin cambiar de tabla despues.
@Entity('clientes')
@Index(['empresa_id', 'email'], { unique: true })
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 250, nullable: true })
  razon_social: string;

  @Column({ length: 13, nullable: true })
  rfc: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
