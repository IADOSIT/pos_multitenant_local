import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('gateway_configs')
@Index(['tienda_id'], { unique: true })
export class GatewayConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tienda_id: number;

  // MercadoPago
  @Column({ length: 500, nullable: true })
  mp_access_token: string;

  @Column({ length: 500, nullable: true })
  mp_public_key: string;

  @Column({ length: 100, nullable: true })
  mp_user_id: string;

  @Column({ length: 200, nullable: true })
  mp_point_device_id: string;

  // Stripe
  @Column({ length: 500, nullable: true })
  stripe_secret_key: string;

  @Column({ length: 500, nullable: true })
  stripe_publishable_key: string;

  @Column({ length: 200, nullable: true })
  stripe_webhook_secret: string;

  // Options
  @Column({ type: 'json', nullable: true })
  opciones: {
    mp_qr_habilitado: boolean;
    mp_point_habilitado: boolean;
    stripe_habilitado: boolean;
    confirmacion_automatica: boolean;
    comision_mp_porcentaje: number;
    comision_stripe_porcentaje: number;
  };

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
