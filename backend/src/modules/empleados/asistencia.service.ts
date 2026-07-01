import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia, EstadoAsistencia } from './registro-asistencia.entity';
import { HorarioEmpleado } from './horario-empleado.entity';
import { EmpleadosService } from './empleados.service';

@Injectable()
export class AsistenciaService {
  constructor(
    @InjectRepository(RegistroAsistencia) private readonly repo: Repository<RegistroAsistencia>,
    @InjectRepository(HorarioEmpleado) private readonly horarioRepo: Repository<HorarioEmpleado>,
    private readonly empleadosService: EmpleadosService,
  ) {}

  async registrarEntrada(empleado_id: number, empresa_id: number, tenant_id: number, timestamp: Date, tipo: string) {
    const fecha = timestamp.toISOString().split('T')[0];
    // Idempotente: no duplicar mismo empleado mismo día
    const existing = await this.repo.findOne({ where: { empleado_id, fecha } });
    if (existing) return { registro: existing, nuevo: false };

    const empleado = await this.empleadosService.findById(empleado_id);
    const dia = timestamp.getDay();
    const horario = await this.horarioRepo.findOne({ where: { empleado_id, dia_semana: dia, activo: true } });

    let estado = EstadoAsistencia.SIN_HORARIO;
    let minutos_tarde: number | null = null;

    if (horario) {
      const [hH, hM] = horario.hora_entrada.split(':').map(Number);
      const limite = new Date(timestamp);
      limite.setHours(hH, hM + horario.tolerancia_minutos, 0, 0);
      const diff = timestamp.getTime() - limite.getTime();
      minutos_tarde = Math.max(0, Math.floor(diff / 60000));
      estado = minutos_tarde === 0 ? EstadoAsistencia.PUNTUAL : EstadoAsistencia.TARDE;
    }

    const registro = await this.repo.save(
      this.repo.create({
        empleado_id,
        tenant_id,
        empresa_id,
        empleado_nombre: `${empleado?.nombre || ''} ${empleado?.apellido || ''}`.trim(),
        fecha,
        timestamp_entrada: timestamp,
        tipo,
        estado,
        minutos_tarde: minutos_tarde ?? undefined,
      }),
    );
    return { registro, nuevo: true };
  }

  async registrarManual(empleado_id: number, fecha: string, hora: string, notas: string, scope: any) {
    const empleado = await this.empleadosService.findOne(empleado_id, scope);
    const timestamp = new Date(`${fecha}T${hora}:00`);
    const result = await this.registrarEntrada(empleado.id, scope.empresa_id, scope.tenant_id, timestamp, 'manual');
    if (notas && result.registro) {
      result.registro.notas = notas;
      await this.repo.save(result.registro);
    }
    return result.registro;
  }

  getAsistencias(scope: any, params: any) {
    const where: any = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id };
    if (params.empleado_id) where.empleado_id = parseInt(params.empleado_id, 10);
    if (params.estado) where.estado = params.estado;
    if (params.fecha) where.fecha = params.fecha;
    return this.repo.find({ where, order: { fecha: 'DESC', timestamp_entrada: 'DESC' }, take: 500 });
  }

  async deleteRegistro(id: number, scope: any) {
    const r = await this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
    if (!r) throw new NotFoundException();
    return this.repo.remove(r);
  }

  async getKPIs(scope: any, desde: string, hasta: string) {
    const base = [scope.tenant_id, scope.empresa_id, desde, hasta];
    const [res] = await this.repo.query(
      `SELECT COUNT(*) as total, SUM(estado='puntual') as p, SUM(estado='tarde') as t, SUM(estado='sin_horario') as s,
       AVG(CASE WHEN minutos_tarde>0 THEN minutos_tarde END) as avg_t
       FROM registros_asistencia WHERE tenant_id=? AND empresa_id=? AND fecha BETWEEN ? AND ?`,
      base,
    );
    const hoy = new Date().toISOString().split('T')[0];
    const [hoyS] = await this.repo.query(
      `SELECT COUNT(DISTINCT empleado_id) as presentes, SUM(estado='tarde') as tarde_hoy
       FROM registros_asistencia WHERE tenant_id=? AND empresa_id=? AND fecha=?`,
      [scope.tenant_id, scope.empresa_id, hoy],
    );
    const topImp = await this.repo.query(
      `SELECT empleado_id, empleado_nombre, COUNT(*) as tardanzas, AVG(minutos_tarde) as avg_min
       FROM registros_asistencia WHERE tenant_id=? AND empresa_id=? AND fecha BETWEEN ? AND ? AND estado='tarde'
       GROUP BY empleado_id, empleado_nombre ORDER BY tardanzas DESC LIMIT 5`,
      base,
    );
    const porDia = await this.repo.query(
      `SELECT fecha, SUM(estado='puntual') as puntuales, SUM(estado='tarde') as tardanzas
       FROM registros_asistencia WHERE tenant_id=? AND empresa_id=? AND fecha BETWEEN ? AND ?
       GROUP BY fecha ORDER BY fecha ASC`,
      base,
    );
    const p = Number(res.p || 0);
    const t = Number(res.t || 0);
    return {
      total_registros: Number(res.total),
      puntuales: p,
      tardanzas: t,
      sin_horario: Number(res.s || 0),
      pct_puntualidad: p + t > 0 ? Math.round((p / (p + t)) * 1000) / 10 : 0,
      promedio_minutos_tarde: Math.round(Number(res.avg_t || 0)),
      empleados_presentes_hoy: Number(hoyS.presentes || 0),
      empleados_tardanza_hoy: Number(hoyS.tarde_hoy || 0),
      top_impuntuales: topImp.map((r: any) => ({
        empleado_id: r.empleado_id,
        empleado_nombre: r.empleado_nombre,
        tardanzas: Number(r.tardanzas),
        avg_minutos_tarde: Math.round(Number(r.avg_min || 0)),
      })),
      por_dia: porDia.map((r: any) => ({ fecha: r.fecha, puntuales: Number(r.puntuales), tardanzas: Number(r.tardanzas) })),
    };
  }
}
