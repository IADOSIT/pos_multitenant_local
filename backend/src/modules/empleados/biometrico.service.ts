import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConfigBiometrico } from './config-biometrico.entity';
import { EmpleadosService } from './empleados.service';
import { AsistenciaService } from './asistencia.service';
import { findMatch, isFmd, decodeFMD } from './fmdMatcher';

@Injectable()
export class BiometricoService {
  constructor(
    @InjectRepository(ConfigBiometrico) private readonly configRepo: Repository<ConfigBiometrico>,
    private readonly empleadosService: EmpleadosService,
    private readonly asistenciaService: AsistenciaService,
  ) {}

  async getOrCreateConfig(empresa_id: number, tenant_id: number) {
    let c = await this.configRepo.findOne({ where: { empresa_id } });
    if (!c) {
      c = this.configRepo.create({ empresa_id, tenant_id, empresa_token: uuidv4(), activo: true });
      await this.configRepo.save(c);
    }
    return c;
  }

  async getConfig(scope: any) {
    return this.getOrCreateConfig(scope.empresa_id, scope.tenant_id);
  }

  async upsertConfig(data: any, scope: any) {
    const c = await this.getConfig(scope);
    if (data.activo !== undefined) c.activo = data.activo;
    if (data.open_device_enabled !== undefined) c.open_device_enabled = data.open_device_enabled;
    if (data.device_ip !== undefined) c.device_ip = data.device_ip;
    if (data.device_timer_s !== undefined) c.device_timer_s = data.device_timer_s;
    return this.configRepo.save(c);
  }

  async regenerarToken(scope: any) {
    const c = await this.getConfig(scope);
    c.empresa_token = uuidv4();
    return this.configRepo.save(c);
  }

  // Bridge descarga todos los templates de empleados activos con huella
  async getTemplates(empresa_token: string) {
    const config = await this.configRepo.findOne({ where: { empresa_token } });
    if (!config || !config.activo) throw new UnauthorizedException('Token invalido o modulo inactivo');
    const templates = await this.empleadosService.getTemplates(config.empresa_id);
    return templates.map((e) => ({
      empleado_id: e.id,
      nombre: `${e.nombre} ${e.apellido || ''}`.trim(),
      fmd_template: e.fmd_template || null,
    }));
  }

  // Bridge reporta heartbeat, retorna si debe refrescar templates
  async heartbeat(empresa_token: string) {
    const config = await this.configRepo.findOne({ where: { empresa_token } });
    if (!config) throw new UnauthorizedException();
    // Retornar siempre refresh_templates:true por simplicidad — bridge decide si hay cambios
    return { ok: true, refresh_templates: true, activo: config.activo };
  }

  // Validar enrollment: huella tiene calidad suficiente y no está duplicada
  async validarEnrollment(fmdB64: string, empresa_id: number, excluir_empleado_id?: number) {
    if (!isFmd(fmdB64)) return { ok: false, reason: 'Formato de huella inválido. Usar SampleFormat.Compressed.' };
    const decoded = decodeFMD(fmdB64);
    if (!decoded || decoded.length < 8) return { ok: false, reason: 'Huella incompleta (muy pocas minucias). Reintentar.' };
    const templates = (await this.empleadosService.getTemplates(empresa_id))
      .filter((e) => e.fmd_template && (!excluir_empleado_id || e.id !== excluir_empleado_id))
      .map((e) => ({ empleado_id: e.id, fmd_template: e.fmd_template }));
    const matchId = findMatch(fmdB64, templates, 55, 8); // threshold alto para duplicados
    if (matchId) return { ok: false, reason: 'Huella ya registrada para otro empleado.' };
    return { ok: true };
  }

  // Bridge no pudo matchear localmente — fallback matching en backend
  async matchFmd(empresa_id: number, fmdB64: string) {
    const templates = (await this.empleadosService.getTemplates(empresa_id)).map((e) => ({
      empleado_id: e.id,
      fmd_template: e.fmd_template,
    }));
    return findMatch(fmdB64, templates);
  }

  // Procesar evento de match desde el bridge (Socket.io)
  async procesarMatch(empresa_token: string, empleado_id: number, timestamp?: Date) {
    const config = await this.configRepo.findOne({ where: { empresa_token } });
    if (!config || !config.activo) throw new UnauthorizedException();
    const ts = timestamp || new Date();
    return this.asistenciaService.registrarEntrada(empleado_id, config.empresa_id, config.tenant_id, ts, 'biometrico');
  }
}
