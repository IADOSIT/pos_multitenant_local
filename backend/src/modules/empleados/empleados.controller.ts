import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { EmpleadosService } from './empleados.service';
import { AsistenciaService } from './asistencia.service';
import { BiometricoService } from './biometrico.service';

@Controller('empleados')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EmpleadosController {
  constructor(
    private readonly emp: EmpleadosService,
    private readonly asist: AsistenciaService,
    private readonly bio: BiometricoService,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  private async checkModulo(scope: any) {
    if (scope.rol === 'superadmin') return;
    const [row] = await this.ds.query('SELECT config_especial FROM empresas WHERE id=? LIMIT 1', [scope.empresa_id]);
    const cfg = typeof row?.config_especial === 'string' ? JSON.parse(row.config_especial) : row?.config_especial;
    if (cfg?.empleados_enabled !== true) {
      throw new ForbiddenException('Módulo de empleados no habilitado para esta empresa');
    }
  }

  // ── Empleados CRUD ─────────────────────────────────────────────────
  @Get() @Roles('superadmin', 'admin', 'manager')
  async list(@TenantScope() s) { await this.checkModulo(s); return this.emp.findAll(s); }

  @Post() @Roles('superadmin', 'admin')
  async create(@Body() d: any, @TenantScope() s) { await this.checkModulo(s); return this.emp.create(d, s); }

  @Put(':id') @Roles('superadmin', 'admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() d: any, @TenantScope() s) {
    await this.checkModulo(s); return this.emp.update(id, d, s);
  }

  @Patch(':id/toggle') @Roles('superadmin', 'admin')
  async toggle(@Param('id', ParseIntPipe) id: number, @TenantScope() s) {
    await this.checkModulo(s); return this.emp.toggle(id, s);
  }

  @Delete(':id/huella') @Roles('superadmin', 'admin')
  async clearHuella(@Param('id', ParseIntPipe) id: number, @TenantScope() s) {
    await this.checkModulo(s); return this.emp.clearFmdTemplate(id, s);
  }

  // ── Horarios ──────────────────────────────────────────────────────
  @Get(':id/horario') @Roles('superadmin', 'admin', 'manager')
  async getHorario(@Param('id', ParseIntPipe) id: number, @TenantScope() s) { await this.checkModulo(s); return this.emp.getHorarios(id, s); }

  @Put(':id/horario') @Roles('superadmin', 'admin')
  async setHorario(@Param('id', ParseIntPipe) id: number, @Body() b: any, @TenantScope() s) {
    await this.checkModulo(s); return this.emp.setHorario(id, b.horarios || [], s);
  }

  // ── Asistencia ───────────────────────────────────────────────────
  @Get('asistencia/kpis') @Roles('superadmin', 'admin', 'manager')
  async kpis(@TenantScope() s, @Query('desde') desde: string, @Query('hasta') hasta: string) {
    await this.checkModulo(s);
    const hoy = new Date().toISOString().split('T')[0];
    return this.asist.getKPIs(s, desde || hoy, hasta || hoy);
  }

  @Get('asistencia') @Roles('superadmin', 'admin', 'manager')
  async asistencias(@TenantScope() s, @Query() p: any) {
    await this.checkModulo(s); return this.asist.getAsistencias(s, p);
  }

  @Post('asistencia/manual') @Roles('superadmin', 'admin', 'manager')
  async manual(@Body() b: any, @TenantScope() s) {
    await this.checkModulo(s); return this.asist.registrarManual(b.empleado_id, b.fecha, b.hora, b.notas, s);
  }

  @Delete('asistencia/:id') @Roles('superadmin', 'admin')
  async delRegistro(@Param('id', ParseIntPipe) id: number, @TenantScope() s) {
    await this.checkModulo(s); return this.asist.deleteRegistro(id, s);
  }

  // ── Biométrico (config) ─────────────────────────────────────────
  @Get('biometrico/config') @Roles('superadmin', 'admin')
  async getCfg(@TenantScope() s) { await this.checkModulo(s); return this.bio.getConfig(s); }

  @Put('biometrico/config') @Roles('superadmin', 'admin')
  async putCfg(@Body() d: any, @TenantScope() s) { await this.checkModulo(s); return this.bio.upsertConfig(d, s); }

  @Patch('biometrico/regenerar-token') @Roles('superadmin', 'admin')
  async regenToken(@TenantScope() s) { await this.checkModulo(s); return this.bio.regenerarToken(s); }
}
