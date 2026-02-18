import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Empresa } from '../empresas/empresa.entity';

@Entity('tiendas')
@Index(['tenant_id', 'empresa_id'])
export class Tienda {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  empresa_id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 50, nullable: true })
  zona_horaria: string;

  @Column({ type: 'json', nullable: true })
  config_ticket: any;

  @Column({ type: 'json', nullable: true })
  config_impresora: any;

  @Column({ type: 'json', nullable: true })
  config_pos: {
    modo_servicio: 'autoservicio' | 'mesa';
    tipo_cobro_mesa: 'pago_inmediato' | 'post_pago';
    num_mesas: number;
    iva_enabled: boolean;
    iva_porcentaje: number;
    iva_incluido: boolean; // true = precio ya incluye IVA, false = IVA se suma al precio
  };

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Empresa, (e) => e.tiendas)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;
}
