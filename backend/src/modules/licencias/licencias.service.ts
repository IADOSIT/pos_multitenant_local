import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licencia, LicenciaPlan, LicenciaEstado } from './licencia.entity';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';

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
    meses: number;           // 0 = permanente
    max_tiendas?: number;
    max_usuarios?: number;
    features?: string[];
    grace_days?: number;
    offline_allowed?: boolean;
    machine_locked?: boolean;
  }): string {
    const defaults = PLAN_DEFAULTS[data.plan] || PLAN_DEFAULTS.basico;
    const permanente = data.meses === 0;
    const now = new Date();
    const fin = permanente ? null : new Date(now);
    if (fin) fin.setMonth(fin.getMonth() + data.meses);

    const payload: any = {
      t: data.tenant_id,
      p: data.plan,
      mt: data.max_tiendas ?? defaults.max_tiendas,
      mu: data.max_usuarios ?? defaults.max_usuarios,
      f: data.features ?? defaults.features,
      fi: now.toISOString().slice(0, 10),
      ff: fin ? fin.toISOString().slice(0, 10) : null,
      g: data.grace_days ?? defaults.grace_days,
      o: data.offline_allowed !== false,
      perm: permanente,
      ml: data.machine_locked || false,
    };
    return this.encrypt(payload);
  }

  // ---- Apply decoded payload to a license record ----
  private applyPayload(lic: Licencia, payload: any, machineFingerprint?: string) {
    lic.codigo_activacion = this.encrypt(payload); // re-encrypt if needed
    lic.plan = payload.p;
    lic.features = payload.f;
    lic.max_tiendas = payload.mt;
    lic.max_usuarios = payload.mu;
    lic.fecha_inicio = payload.fi;
    lic.fecha_fin = payload.ff ?? null;
    lic.grace_days = payload.g;
    lic.offline_allowed = payload.o;
    lic.permanente = payload.perm || false;
    lic.machine_locked = payload.ml || false;
    lic.estado = LicenciaEstado.ACTIVA;
    lic.activated_at = new Date();
    lic.last_heartbeat = new Date();

    if (lic.machine_locked && machineFingerprint) {
      if (lic.machine_fingerprint && lic.machine_fingerprint !== machineFingerprint) {
        throw new BadRequestException('Esta licencia ya está vinculada a otro equipo. Contacta al administrador.');
      }
      lic.machine_fingerprint = machineFingerprint;
    }
  }

  // ---- Activate license (CLIENT) ----
  async activar(tenantId: number, codigoFormateado: string, machineFingerprint?: string) {
    const raw = this.unformatCode(codigoFormateado);
    const payload = this.decrypt(raw);
    // Note: payload.t (tenant_id en el código) no se valida contra tenantId local.
    // El código EXE offline siempre tiene tenant_id=1 en local, pero el superadmin
    // lo genera desde el VPS donde tenant_id puede ser distinto.
    // La seguridad está en el cifrado AES-256 con LICENSE_SECRET.

    let lic = await this.repo.findOne({ where: { tenant_id: tenantId } });
    if (!lic) {
      lic = this.repo.create({
        tenant_id: tenantId,
        codigo_instalacion: this.generateInstallCode(tenantId),
      });
    }

    // Store the raw code then apply payload
    lic.codigo_activacion = raw;
    this.applyPayload(lic, payload, machineFingerprint);
    return this.repo.save(lic);
  }

  // ---- Generate one-time activation token (SUPERADMIN) ----
  async generarToken(licenciaId: number, activationCode: string): Promise<{ token: string }> {
    const lic = await this.repo.findOneOrFail({ where: { id: licenciaId } });
    // Validate the code is valid (can be decrypted)
    this.decrypt(this.unformatCode(activationCode));

    const token = uuid().replace(/-/g, '');
    const expires = new Date();
    expires.setHours(expires.getHours() + 48);

    lic.activation_token = token;
    lic.activation_token_code = this.unformatCode(activationCode);
    lic.activation_token_expires = expires;
    lic.activation_token_used = false;
    await this.repo.save(lic);
    return { token };
  }

  // ---- Activate via one-time token (CLIENT / public) ----
  async activarConToken(token: string, machineFingerprint?: string) {
    const lic = await this.repo.findOne({ where: { activation_token: token } });
    if (!lic) throw new BadRequestException('Token de activación inválido');
    if (lic.activation_token_used) throw new BadRequestException('Este enlace ya fue utilizado');
    if (!lic.activation_token_expires || new Date() > lic.activation_token_expires) {
      throw new BadRequestException('El enlace de activación ha expirado (válido 48 h)');
    }

    const payload = this.decrypt(lic.activation_token_code);
    lic.codigo_activacion = lic.activation_token_code;
    this.applyPayload(lic, payload, machineFingerprint);
    lic.activation_token_used = true;
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
    if (lic.permanente) {
      if (lic.estado !== LicenciaEstado.ACTIVA) { lic.estado = LicenciaEstado.ACTIVA; await this.repo.save(lic); }
      return lic;
    }
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

    let diasRestantes = 9999;
    let enGrace = false;
    let diasGraceRestantes = 0;
    let expirada = false;

    if (!lic.permanente && lic.fecha_fin) {
      const fin = new Date(lic.fecha_fin);
      const graceEnd = new Date(fin);
      graceEnd.setDate(graceEnd.getDate() + lic.grace_days);
      diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      enGrace = hoy > fin && hoy <= graceEnd;
      diasGraceRestantes = enGrace ? Math.ceil((graceEnd.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      expirada = hoy > graceEnd;
    }

    const bloqueada = !lic.permanente && expirada && lic.estado !== LicenciaEstado.SUSPENDIDA;
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
      dias_restantes: lic.permanente ? null : diasRestantes,
      en_grace: enGrace,
      dias_grace_restantes: diasGraceRestantes,
      expirada,
      solo_lectura: soloLectura,
      bloqueada,
      offline_allowed: lic.offline_allowed,
      permanente: lic.permanente,
      machine_locked: lic.machine_locked,
      machine_fingerprint_set: !!lic.machine_fingerprint,
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
    const { id: _id, created_at, updated_at, ...clean } = data as any;
    await this.repo.update(id, clean);
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
