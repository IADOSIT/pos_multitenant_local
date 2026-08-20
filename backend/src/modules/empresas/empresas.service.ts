import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Empresa } from './empresa.entity';
import { TipoCambioHistorial } from './tipo-cambio-historial.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class EmpresasService {
  private readonly logger = new Logger(EmpresasService.name);

  constructor(
    @InjectRepository(Empresa) private repo: Repository<Empresa>,
    @InjectRepository(TipoCambioHistorial) private historialRepo: Repository<TipoCambioHistorial>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // Al activar "inventario compartido" por primera vez para una empresa, el stock hasta ese
  // momento vivia en productos.stock_actual (una sola cantidad para TODAS sus tiendas). Sembramos
  // ese mismo valor en producto_tienda.stock para cada tienda (sin pisar filas que ya existan,
  // por si el admin ya habia asignado algo) para que ninguna tienda quede en 0 de golpe al
  // encender el toggle. A partir de aqui, ventas.service.ts descuenta por tienda; el admin puede
  // corregir cantidades reales despues con transferencias o ajustes manuales.
  private async migrarStockPorTienda(empresa_id: number) {
    const productos = await this.dataSource.query(
      'SELECT id, stock_actual FROM productos WHERE empresa_id = ? AND controla_stock = 1',
      [empresa_id],
    );
    if (!productos.length) return;
    const tiendas = await this.dataSource.query('SELECT id FROM tiendas WHERE empresa_id = ?', [empresa_id]);
    if (!tiendas.length) return;
    for (const prod of productos) {
      for (const tienda of tiendas) {
        const [existing] = await this.dataSource.query(
          'SELECT id FROM producto_tienda WHERE producto_id = ? AND tienda_id = ?',
          [prod.id, tienda.id],
        );
        if (existing) continue;
        await this.dataSource.query(
          `INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, stock, disponible)
           SELECT p.tenant_id, ?, p.id, ?, 1 FROM productos p WHERE p.id = ?`,
          [tienda.id, prod.stock_actual, prod.id],
        );
      }
    }
    this.logger.log(`Inventario compartido activado: stock sembrado para empresa ${empresa_id} (${productos.length} productos x ${tiendas.length} tiendas)`);
  }

  // Tipo de cambio automatico USD/MXN: serie SF43718 (FIX) del Banco de Mexico.
  // Requiere token gratuito (https://www.banxico.org.mx/SieAPIRest/service/v1/token) en BANXICO_TOKEN.
  // Sin token configurado, las empresas en modo 'automatico' simplemente conservan el ultimo
  // valor cacheado (o deben usar modo manual).
  @Cron('0 8 * * *')
  async actualizarTiposCambioAutomaticos() {
    const token = process.env.BANXICO_TOKEN;
    if (!token) return;
    const empresas = await this.findEmpresasConTipoCambioAutomatico();
    if (empresas.length === 0) return;
    let tipoCambio: number | null = null;
    try {
      const res = await fetch(
        `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno?token=${token}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) throw new Error(`Banxico respondio ${res.status}`);
      const json: any = await res.json();
      const dato = json?.bmx?.series?.[0]?.datos?.[0]?.dato;
      tipoCambio = dato ? parseFloat(String(dato).replace(/,/g, '')) : null;
    } catch (err) {
      this.logger.warn(`No se pudo obtener el tipo de cambio de Banxico: ${err}`);
      return;
    }
    if (!tipoCambio || Number.isNaN(tipoCambio)) return;
    for (const empresa of empresas) {
      await this.actualizarTipoCambioAutomatico(empresa.id, tipoCambio);
    }
  }

  findAll(scope: any) {
    const where: any = {};
    if (scope.rol !== UserRole.SUPERADMIN) where.tenant_id = scope.tenant_id;
    return this.repo.find({ where, relations: ['tiendas'], order: { nombre: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['tiendas'] });
  }

  create(data: Partial<Empresa>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Empresa>) {
    const { id: _id, created_at, updated_at, tiendas, ...clean } = data as any;
    await this.repo.update(id, clean);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async setConfigEspecial(
    id: number,
    data: {
      mostrar_precios?: boolean;
      precio_manual?: boolean;
      notif_cliente_estados?: boolean;
      empleados_enabled?: boolean;
      campos_formulario?: any;
      inventario_compartido?: boolean;
      transferencias_activo?: boolean;
      moneda?: {
        activa?: boolean;
        codigo?: string;
        modo_tipo_cambio?: 'manual' | 'automatico';
        tipo_cambio_manual?: number;
        tipo_cambio_actual?: number;
        modo_visualizacion?: 'ambas' | 'solo_base' | 'solo_secundaria';
      };
    },
    scope: any,
  ) {
    const where: any = { id };
    if (scope.rol !== UserRole.SUPERADMIN) where.tenant_id = scope.tenant_id;
    const empresa = await this.repo.findOne({ where });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    // empleados_enabled (modulo biometrico) solo lo puede tocar superadmin, aunque el
    // endpoint tambien admita admin para el resto de flags de config_especial
    const { empleados_enabled, ...rest } = data;
    const safeData = scope.rol === UserRole.SUPERADMIN ? data : rest;
    const activandoInventarioCompartido = safeData.inventario_compartido === true && empresa.config_especial?.inventario_compartido !== true;
    // El modo manual de tipo_cambio usa tipo_cambio_manual como tipo_cambio_actual de una vez,
    // asi el resto del sistema (POS, tickets) solo necesita leer tipo_cambio_actual.
    const tipoCambioAnterior = empresa.config_especial?.moneda?.tipo_cambio_actual;
    let registrarHistorialManual: { codigo: string; tipo_cambio: number } | null = null;
    if (safeData.moneda) {
      const m = safeData.moneda;
      if (m.modo_tipo_cambio === 'manual' && typeof m.tipo_cambio_manual === 'number') {
        m.tipo_cambio_actual = m.tipo_cambio_manual;
        if (m.tipo_cambio_manual !== tipoCambioAnterior) {
          registrarHistorialManual = { codigo: m.codigo || empresa.config_especial?.moneda?.codigo || 'USD', tipo_cambio: m.tipo_cambio_manual };
        }
      }
    }
    empresa.config_especial = {
      ...(empresa.config_especial || {}),
      ...safeData,
      ...(safeData.moneda ? { moneda: { ...(empresa.config_especial?.moneda || {}), ...safeData.moneda } } : {}),
    };
    const saved = await this.repo.save(empresa);
    if (activandoInventarioCompartido) {
      await this.migrarStockPorTienda(id);
    }
    if (registrarHistorialManual) {
      await this.historialRepo.save(this.historialRepo.create({
        empresa_id: id,
        codigo: registrarHistorialManual.codigo,
        tipo_cambio: registrarHistorialManual.tipo_cambio,
        origen: 'manual',
      }));
    }
    return { config_especial: saved.config_especial };
  }

  // Usado por el cron de tipo de cambio automatico: no pasa por setConfigEspecial para no
  // pisar otros campos ni requerir scope de usuario.
  async actualizarTipoCambioAutomatico(empresa_id: number, tipo_cambio: number) {
    const empresa = await this.repo.findOne({ where: { id: empresa_id } });
    if (!empresa) return;
    const codigo = empresa.config_especial?.moneda?.codigo || 'USD';
    empresa.config_especial = {
      ...(empresa.config_especial || {}),
      moneda: {
        ...(empresa.config_especial?.moneda || {}),
        tipo_cambio_actual: tipo_cambio,
        tipo_cambio_actualizado_at: new Date().toISOString(),
      },
    };
    await this.repo.save(empresa);
    await this.historialRepo.save(this.historialRepo.create({ empresa_id, codigo, tipo_cambio, origen: 'automatico' }));
  }

  // Historico del tipo de cambio para graficar en Reportes (solo con moneda.activa=true).
  // Se agrupa en SQL por el periodo pedido para no traer miles de filas al frontend.
  async getHistorialTipoCambio(empresa_id: number, periodo: 'dia' | 'semana' | 'mes' | 'anio') {
    let periodoExpr: string;
    let dias: number;
    switch (periodo) {
      case 'semana':
        periodoExpr = "DATE_FORMAT(created_at, '%x-W%v')";
        dias = 7 * 26; // ~26 semanas
        break;
      case 'mes':
        periodoExpr = "DATE_FORMAT(created_at, '%Y-%m')";
        dias = 366 * 2;
        break;
      case 'anio':
        periodoExpr = "DATE_FORMAT(created_at, '%Y')";
        dias = 366 * 6;
        break;
      case 'dia':
      default:
        periodoExpr = "DATE_FORMAT(created_at, '%Y-%m-%d')";
        dias = 60;
        break;
    }
    const rows = await this.dataSource.query(
      `SELECT ${periodoExpr} AS periodo, AVG(tipo_cambio) AS tipo_cambio, MAX(created_at) AS fecha
       FROM tipo_cambio_historial
       WHERE empresa_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY periodo
       ORDER BY fecha ASC`,
      [empresa_id, dias],
    );
    return rows.map((r: any) => ({ periodo: r.periodo, tipo_cambio: parseFloat(r.tipo_cambio), fecha: r.fecha }));
  }

  // Empresas con moneda secundaria activa en modo automatico (para el cron)
  async findEmpresasConTipoCambioAutomatico(): Promise<Empresa[]> {
    const todas = await this.repo.find();
    return todas.filter((e) => e.config_especial?.moneda?.activa && e.config_especial?.moneda?.modo_tipo_cambio === 'automatico');
  }

  // Usado por módulos públicos (self-order, e-commerce) para respetar la config sin exponer el resto de la entidad
  async getConfigEspecial(empresa_id: number): Promise<{
    mostrar_precios: boolean;
    precio_manual: boolean;
    notif_cliente_estados: boolean;
    inventario_compartido: boolean;
    transferencias_activo: boolean;
    moneda: { activa: boolean; codigo: string; tipo_cambio_actual: number; modo_visualizacion: 'ambas' | 'solo_base' | 'solo_secundaria' };
  }> {
    const empresa = await this.repo.findOne({ where: { id: empresa_id } });
    const cfg = empresa?.config_especial || {};
    return {
      mostrar_precios: cfg.mostrar_precios !== false, // true por defecto si undefined
      precio_manual: cfg.precio_manual === true,       // false por defecto
      notif_cliente_estados: cfg.notif_cliente_estados === true, // false por defecto
      inventario_compartido: cfg.inventario_compartido === true, // false por defecto
      transferencias_activo: cfg.transferencias_activo === true, // false por defecto
      moneda: {
        activa: cfg.moneda?.activa === true,
        codigo: cfg.moneda?.codigo || 'USD',
        tipo_cambio_actual: cfg.moneda?.tipo_cambio_actual || 0,
        modo_visualizacion: cfg.moneda?.modo_visualizacion || 'ambas',
      },
    };
  }
}
