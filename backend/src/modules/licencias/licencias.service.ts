import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licencia, LicenciaPlan, LicenciaEstado } from './licencia.entity';
import * as crypto from 'crypto';

const LICENSE_SECRET = process.env.LICENSE_SECRET || 'iados-pos-lic-secret-2026-k3y!';

const PLAN_DEFAULTS: Record<string, { max_tiendas: number; max_usuarios: number; features: string[]; grace_days: number }> = {
  basico: { max_tiendas: 1, max_usuarios: 3, features: ['pos', 'caja'], grace_days: 7 },
  pro: { max_tiendas: 3, max_usuarios: 10, features: ['pos', 'caja', 'pedidos', 'reportes', 'dashboard'], grace_days: 15 },
  enterprise: { max_tiendas: 999, max_usuarios: 999, features: ['pos', 'caja', 'pedidos', 'reportes', 'dashboard', 'kiosco', 'multitenant'], grace_days: 30 },
};

@Injectable()
export class LicenciasService {
  constructor(
    @InjectRepository(Licencia) private repo: Repository<Licencia>,
  ) {}

  // ---- Crypto helpers ----
  private deriveKey(): Buffer {
    return crypto.scryptSync(LICENSE_SECRET, 'iados-lic-salt', 32);
  }

  private encrypt(data: object): string {
    const key = this.deriveKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let enc = cipher.update(JSON.stringify(data), 'utf8');
    enc = Buffer.concat([enc, cipher.final()]);
    return Buffer.concat([iv, enc]).toString('hex');
  }

  private decrypt(code: string): any {
    try {
      const key = this.deriveKey();
      const buf = Buffer.from(code, 'hex');
      const iv = buf.subarray(0, 16);
      const enc = buf.subarray(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let dec = decipher.update(enc);
      dec = Buffer.concat([dec, decipher.final()]);
      return JSON.parse(dec.toString('utf8'));
    } catch {
      throw new BadRequestException('Codigo de activacion invalido');
    }
  }

  formatCode(raw: string): string {
    return raw.match(/.{1,5}/g)?.join('-') || raw;
  }

  unformatCode(formatted: string): string {
    return formatted.replace(/[-\s]/g, '');
  }

  // ---- Installation code ----
  generateInstallCode(tenantId: number): string {
    const hmac = crypto.createHmac('sha256', LICENSE_SECRET)
      .update(`${tenantId}-${Date.now()}-${Math.random()}`)
      .digest('hex').substring(0, 8).toUpperCase();
    return `INS-${hmac}`;
  }

  // ---- Generate activation code (SUPERADMIN) ----
  generarCodigoActivacion(data: {
    tenant_id: number;
    plan: string;
    meses: number;
    max_tiendas?: number;
    max_usuarios?: number;
    features?: string[];
    grace_days?: number;
    offline_allowed?: boolean;
  }): string {
    const defaults = PLAN_DEFAULTS[data.plan] || PLAN_DEFAULTS.basico;
    const now = new Date();
    const fin = new Date(now);
    fin.setMonth(fin.getMonth() + data.meses);

    const payload = {
      t: data.tenant_id,
      p: data.plan,
      mt: data.max_tiendas ?? defaults.max_tiendas,
      mu: data.max_usuarios ?? defaults.max_usuarios,
      f: data.features ?? defaults.features,
      fi: now.toISOString().slice(0, 10),
      ff: fin.toISOString().slice(0, 10),
      g: data.grace_days ?? defaults.grace_days,
      o: data.offline_allowed !== false,
    };
    return this.encrypt(payload);
  }

  // ---- Activate license (CLIENT) ----
  async activar(tenantId: number, codigoFormateado: string) {
    const raw = this.unformatCode(codigoFormateado);
    const payload = this.decrypt(raw);

    if (payload.t !== tenantId) {
      throw new BadRequestException('Este codigo no corresponde a este tenant');
    }

    let lic = await this.repo.findOne({ where: { tenant_id: tenantId } });
    if (!lic) {
      lic = this.repo.create({
        tenant_id: tenantId,
        codigo_instalacion: this.generateInstallCode(tenantId),
      });
    }

    lic.codigo_activacion = raw;
    lic.plan = payload.p;
    lic.features = payload.f;
    lic.max_tiendas = payload.mt;
    lic.max_usuarios = payload.mu;
    lic.fecha_inicio = payload.fi;
    lic.fecha_fin = payload.ff;
    lic.grace_days = payload.g;
    lic.offline_allowed = payload.o;
    lic.estado = LicenciaEstado.ACTIVA;
    lic.activated_at = new Date();
    lic.last_heartbeat = new Date();

    return this.repo.save(lic);
  }

  // ---- Get or create trial license ----
  async getOrCreateTrial(tenantId: number): Promise<Licencia> {
    let lic = await this.repo.findOne({ where: { tenant_id: tenantId } });
    if (lic) return this.refreshEstado(lic);

    const now = new Date();
    const fin = new Date(now);
    fin.setDate(fin.getDate() + 30);

    lic = await this.repo.save(this.repo.create({
      tenant_id: tenantId,
      codigo_instalacion: this.generateInstallCode(tenantId),
      plan: LicenciaPlan.PRO,
      features: PLAN_DEFAULTS.pro.features,
      max_tiendas: 2,
      max_usuarios: 5,
      fecha_inicio: now.toISOString().slice(0, 10),
      fecha_fin: fin.toISOString().slice(0, 10),
      grace_days: 7,
      offline_allowed: true,
      estado: LicenciaEstado.TRIAL,
    }));
    return lic;
  }

  // ---- Refresh state based on dates ----
  private async refreshEstado(lic: Licencia): Promise<Licencia> {
    if (lic.estado === LicenciaEstado.SUSPENDIDA) return lic;
    if (!lic.fecha_fin) return lic;

    const hoy = new Date();
    const fin = new Date(lic.fecha_fin);
    const graceEnd = new Date(fin);
    graceEnd.setDate(graceEnd.getDate() + lic.grace_days);

    let nuevoEstado = lic.estado;
    if (hoy <= fin) {
      nuevoEstado = lic.estado === LicenciaEstado.TRIAL ? LicenciaEstado.TRIAL : LicenciaEstado.ACTIVA;
    } else if (hoy <= graceEnd) {
      nuevoEstado = lic.estado; // keep current, grace period active
    } else {
      nuevoEstado = LicenciaEstado.EXPIRADA;
    }

    if (nuevoEstado !== lic.estado) {
      lic.estado = nuevoEstado;
      await this.repo.save(lic);
    }
    return lic;
  }

  // ---- License status (public, for frontend) ----
  async getEstado(tenantId: number) {
    const lic = await this.getOrCreateTrial(tenantId);
    const hoy = new Date();
    const fin = new Date(lic.fecha_fin);
    const graceEnd = new Date(fin);
    graceEnd.setDate(graceEnd.getDate() + lic.grace_days);

    const diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    const enGrace = hoy > fin && hoy <= graceEnd;
    const diasGraceRestantes = enGrace ? Math.ceil((graceEnd.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const expirada = hoy > graceEnd;

    // Block ventas if expired
    const bloqueada = expirada && lic.estado !== LicenciaEstado.SUSPENDIDA;
    // Solo lectura = expirada
    const soloLectura = bloqueada;

    return {
      id: lic.id,
      tenant_id: lic.tenant_id,
      codigo_instalacion: lic.codigo_instalacion,
      plan: lic.plan,
      features: lic.features || [],
      max_tiendas: lic.max_tiendas,
      max_usuarios: lic.max_usuarios,
      fecha_inicio: lic.fecha_inicio,
      fecha_fin: lic.fecha_fin,
      grace_days: lic.grace_days,
      estado: lic.estado,
      dias_restantes: diasRestantes,
      en_grace: enGrace,
      dias_grace_restantes: diasGraceRestantes,
      expirada,
      solo_lectura: soloLectura,
      bloqueada,
      offline_allowed: lic.offline_allowed,
    };
  }

  // ---- Heartbeat (online check) ----
  async heartbeat(tenantId: number) {
    const lic = await this.repo.findOne({ where: { tenant_id: tenantId } });
    if (lic) {
      lic.last_heartbeat = new Date();
      await this.repo.save(lic);
    }
    return this.getEstado(tenantId);
  }

  // ---- SUPERADMIN: list all licenses ----
  async findAll() {
    const licencias = await this.repo.find({ order: { created_at: 'DESC' } });
    const result: Licencia[] = [];
    for (const lic of licencias) {
      await this.refreshEstado(lic);
      result.push(lic);
    }
    return result;
  }

  // ---- SUPERADMIN: get one ----
  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  // ---- SUPERADMIN: suspend ----
  async suspender(id: number) {
    const lic = await this.repo.findOneOrFail({ where: { id } });
    lic.estado = LicenciaEstado.SUSPENDIDA;
    return this.repo.save(lic);
  }

  // ---- SUPERADMIN: reactivate ----
  async reactivar(id: number) {
    const lic = await this.repo.findOneOrFail({ where: { id } });
    lic.estado = LicenciaEstado.ACTIVA;
    return this.repo.save(lic);
  }

  // ---- SUPERADMIN: update license directly ----
  async update(id: number, data: Partial<Licencia>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  // ---- SUPERADMIN: delete ----
  async remove(id: number) {
    return this.repo.delete(id);
  }

  // ---- Check feature access ----
  async hasFeature(tenantId: number, feature: string): Promise<boolean> {
    const estado = await this.getEstado(tenantId);
    if (estado.bloqueada) return false;
    return estado.features.includes(feature);
  }
}
