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

  @Column({ type: 'json', nullable: true })
  config_apariencia: {
    tema: string;
    paleta: string;
  };

  @Column({ type: 'json', nullable: true })
  config_especial: {
    mostrar_precios?: boolean;      // default implícito: true (si null/undefined, se trata como true)
    precio_manual?: boolean;        // default implícito: false
    notif_cliente_estados?: boolean; // default implícito: false
    empleados_enabled?: boolean;
    // Inventario compartido entre tiendas de esta empresa: si una tienda no tiene stock
    // de un producto, el POS puede ofrecer apartarlo en otra tienda de la misma empresa.
    inventario_compartido?: boolean; // default implícito: false
    // Transferencias directas de stock entre tiendas de esta empresa (folio-based).
    // Requiere ademas inventario_compartido=true, ya que opera sobre producto_tienda.
    transferencias_activo?: boolean; // default implícito: false
    moneda?: {
      activa?: boolean;              // segunda moneda habilitada (default: false)
      codigo?: string;                // ej. 'USD' (default: 'USD')
      modo_tipo_cambio?: 'manual' | 'automatico'; // default: 'manual'
      tipo_cambio_manual?: number;    // MXN por 1 unidad de la moneda secundaria
      tipo_cambio_actual?: number;    // valor vigente (manual o el ultimo obtenido automaticamente)
      tipo_cambio_actualizado_at?: string; // ISO, solo cuando modo automatico
      modo_visualizacion?: 'ambas' | 'solo_base' | 'solo_secundaria'; // default: 'ambas'
    };
  } | null;

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
