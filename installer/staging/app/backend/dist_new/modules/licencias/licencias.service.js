"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenciasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const licencia_entity_1 = require("./licencia.entity");
const crypto = require("crypto");
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'iados-pos-lic-secret-2026-k3y!';
const PLAN_DEFAULTS = {
    basico: { max_tiendas: 1, max_usuarios: 3, features: ['pos', 'caja'], grace_days: 7 },
    pro: { max_tiendas: 3, max_usuarios: 10, features: ['pos', 'caja', 'pedidos', 'reportes', 'dashboard'], grace_days: 15 },
    enterprise: { max_tiendas: 999, max_usuarios: 999, features: ['pos', 'caja', 'pedidos', 'reportes', 'dashboard', 'kiosco', 'multitenant'], grace_days: 30 },
};
let LicenciasService = class LicenciasService {
    constructor(repo) {
        this.repo = repo;
    }
    deriveKey() {
        return crypto.scryptSync(LICENSE_SECRET, 'iados-lic-salt', 32);
    }
    encrypt(data) {
        const key = this.deriveKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let enc = cipher.update(JSON.stringify(data), 'utf8');
        enc = Buffer.concat([enc, cipher.final()]);
        return Buffer.concat([iv, enc]).toString('hex');
    }
    decrypt(code) {
        try {
            const key = this.deriveKey();
            const buf = Buffer.from(code, 'hex');
            const iv = buf.subarray(0, 16);
            const enc = buf.subarray(16);
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let dec = decipher.update(enc);
            dec = Buffer.concat([dec, decipher.final()]);
            return JSON.parse(dec.toString('utf8'));
        }
        catch {
            throw new common_1.BadRequestException('Codigo de activacion invalido');
        }
    }
    formatCode(raw) {
        return raw.match(/.{1,5}/g)?.join('-') || raw;
    }
    unformatCode(formatted) {
        return formatted.replace(/[-\s]/g, '');
    }
    generateInstallCode(tenantId) {
        const hmac = crypto.createHmac('sha256', LICENSE_SECRET)
            .update(`${tenantId}-${Date.now()}-${Math.random()}`)
            .digest('hex').substring(0, 8).toUpperCase();
        return `INS-${hmac}`;
    }
    generarCodigoActivacion(data) {
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
    async activar(tenantId, codigoFormateado) {
        const raw = this.unformatCode(codigoFormateado);
        const payload = this.decrypt(raw);
        if (payload.t !== tenantId) {
            throw new common_1.BadRequestException('Este codigo no corresponde a este tenant');
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
        lic.estado = licencia_entity_1.LicenciaEstado.ACTIVA;
        lic.activated_at = new Date();
        lic.last_heartbeat = new Date();
        return this.repo.save(lic);
    }
    async getOrCreateTrial(tenantId) {
        let lic = await this.repo.findOne({ where: { tenant_id: tenantId } });
        if (lic)
            return this.refreshEstado(lic);
        const now = new Date();
        const fin = new Date(now);
        fin.setDate(fin.getDate() + 30);
        lic = await this.repo.save(this.repo.create({
            tenant_id: tenantId,
            codigo_instalacion: this.generateInstallCode(tenantId),
            plan: licencia_entity_1.LicenciaPlan.PRO,
            features: PLAN_DEFAULTS.pro.features,
            max_tiendas: 2,
            max_usuarios: 5,
            fecha_inicio: now.toISOString().slice(0, 10),
            fecha_fin: fin.toISOString().slice(0, 10),
            grace_days: 7,
            offline_allowed: true,
            estado: licencia_entity_1.LicenciaEstado.TRIAL,
        }));
        return lic;
    }
    async refreshEstado(lic) {
        if (lic.estado === licencia_entity_1.LicenciaEstado.SUSPENDIDA)
            return lic;
        if (!lic.fecha_fin)
            return lic;
        const hoy = new Date();
        const fin = new Date(lic.fecha_fin);
        const graceEnd = new Date(fin);
        graceEnd.setDate(graceEnd.getDate() + lic.grace_days);
        let nuevoEstado = lic.estado;
        if (hoy <= fin) {
            nuevoEstado = lic.estado === licencia_entity_1.LicenciaEstado.TRIAL ? licencia_entity_1.LicenciaEstado.TRIAL : licencia_entity_1.LicenciaEstado.ACTIVA;
        }
        else if (hoy <= graceEnd) {
            nuevoEstado = lic.estado;
        }
        else {
            nuevoEstado = licencia_entity_1.LicenciaEstado.EXPIRADA;
        }
        if (nuevoEstado !== lic.estado) {
            lic.estado = nuevoEstado;
            await this.repo.save(lic);
        }
        return lic;
    }
    async getEstado(tenantId) {
        const lic = await this.getOrCreateTrial(tenantId);
        const hoy = new Date();
        const fin = new Date(lic.fecha_fin);
        const graceEnd = new Date(fin);
        graceEnd.setDate(graceEnd.getDate() + lic.grace_days);
        const diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        const enGrace = hoy > fin && hoy <= graceEnd;
        const diasGraceRestantes = enGrace ? Math.ceil((graceEnd.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const expirada = hoy > graceEnd;
        const bloqueada = expirada && lic.estado !== licencia_entity_1.LicenciaEstado.SUSPENDIDA;
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
    async heartbeat(tenantId) {
        const lic = await this.repo.findOne({ where: { tenant_id: tenantId } });
        if (lic) {
            lic.last_heartbeat = new Date();
            await this.repo.save(lic);
        }
        return this.getEstado(tenantId);
    }
    async findAll() {
        const licencias = await this.repo.find({ order: { created_at: 'DESC' } });
        const result = [];
        for (const lic of licencias) {
            await this.refreshEstado(lic);
            result.push(lic);
        }
        return result;
    }
    async findOne(id) {
        return this.repo.findOne({ where: { id } });
    }
    async suspender(id) {
        const lic = await this.repo.findOneOrFail({ where: { id } });
        lic.estado = licencia_entity_1.LicenciaEstado.SUSPENDIDA;
        return this.repo.save(lic);
    }
    async reactivar(id) {
        const lic = await this.repo.findOneOrFail({ where: { id } });
        lic.estado = licencia_entity_1.LicenciaEstado.ACTIVA;
        return this.repo.save(lic);
    }
    async update(id, data) {
        const { id: _id, created_at, updated_at, ...clean } = data;
        await this.repo.update(id, clean);
        return this.repo.findOne({ where: { id } });
    }
    async remove(id) {
        return this.repo.delete(id);
    }
    async hasFeature(tenantId, feature) {
        const estado = await this.getEstado(tenantId);
        if (estado.bloqueada)
            return false;
        return estado.features.includes(feature);
    }
};
exports.LicenciasService = LicenciasService;
exports.LicenciasService = LicenciasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(licencia_entity_1.Licencia)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LicenciasService);
//# sourceMappingURL=licencias.service.js.map