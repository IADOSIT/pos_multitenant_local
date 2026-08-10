import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Config por empresa para "Generar con IA" en Productos. Por defecto usa Pollinations.ai
// (gratis, sin API key, corre desde el navegador). Si la empresa captura su propia API key
// de OpenAI, se usa esa en su lugar (mejor calidad, pero de paga) — la llamada a OpenAI
// siempre corre en el backend para que la key nunca llegue al navegador.
@Entity('config_ia_imagenes')
export class ConfigIaImagenes {
  @PrimaryGeneratedColumn() id: number;

  @Column({ unique: true }) empresa_id: number;
  @Column() tenant_id: number;

  @Column({ length: 20, default: 'pollinations' }) provider: 'pollinations' | 'openai';

  @Column({ type: 'text', nullable: true }) openai_api_key: string | null;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
