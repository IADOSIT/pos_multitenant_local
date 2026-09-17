import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, And, MoreThanOrEqual, LessThan } from 'typeorm';
import { Cotizacion } from './cotizacion.entity';
import { CotizacionVersion, CotizacionItem } from './cotizacion-version.entity';
import { EcommerceConfig } from '../ecommerce/ecommerce-config.entity';
import { puedeCotizar, calcularTotales, vigenciaHasta } from './cotizacion.logic';

export interface CotizarDto {
  items: { producto_id: number; precio_unitario: number }[];
  descuento?: number;
  vigencia_dias?: number;
  mensaje_cliente?: string;
  tienda_id?: number;
}

const VIGENCIA_DEFAULT = 15;

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Cotizacion) private cotRepo: Repository<Cotizacion>,
    @InjectRepository(CotizacionVersion) private verRepo: Repository<CotizacionVersion>,
    @InjectRepository(EcommerceConfig) private configRepo: Repository<EcommerceConfig>,
  ) {}

  async listar(scope: any, filtros: { estado?: string; q?: string; desde?: string; hasta?: string } = {}) {
    const base: any = { empresa_id: scope.empresa_id, tenant_id: scope.tenant_id };
    if (filtros.estado) base.estado = filtros.estado;

    const rango = this.rangoFechas(filtros.desde, filtros.hasta);
    if (rango) base.created_at = rango;

    // Un array en TypeORM es un OR de condiciones completas, no un OR "suelto" sobre
    // un solo campo: cada rama repite el scope completo (empresa_id + tenant_id, y el
    // estado/rango si vinieron) para no abrir una fuga entre tenants por buscar texto.
    const where = filtros.q
      ? [
          { ...base, numero: Like(`%${filtros.q}%`) },
          { ...base, cliente_nombre: Like(`%${filtros.q}%`) },
        ]
      : base;

    return this.cotRepo.find({ where, order: { created_at: 'DESC' }, take: 200 });
  }

  private rangoFechas(desde?: string, hasta?: string) {
    // created_at es datetime completo: 'hasta' es una fecha (dia), no un instante, asi
    // que el limite superior tiene que ser el INICIO DEL DIA SIGUIENTE comparado con
    // LessThan (estricto) - comparar contra 'hasta 00:00:00' con LessThanOrEqual
    // dejaria fuera casi todo lo creado ese mismo dia.
    const hastaExclusivo = hasta ? this.finDelDia(hasta) : null;
    if (desde && hastaExclusivo) return And(MoreThanOrEqual(desde), LessThan(hastaExclusivo));
    if (desde) return MoreThanOrEqual(desde);
    if (hastaExclusivo) return LessThan(hastaExclusivo);
    return null;
  }

  private finDelDia(fecha: string): string {
    const d = new Date(`${fecha}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  private async buscar(scope: any, id: number): Promise<Cotizacion> {
    const c = await this.cotRepo.findOne({
      where: { id, empresa_id: scope.empresa_id, tenant_id: scope.tenant_id },
    });
    if (!c) throw new NotFoundException('Cotización no encontrada');
    return c;
  }

  async detalle(scope: any, id: number) {
    const cotizacion = await this.buscar(scope, id);
    const versiones = await this.verRepo.find({
      where: { cotizacion_id: cotizacion.id },
      order: { version: 'ASC' },
    });
    return { cotizacion, versiones };
  }

  // Mismo verbo para la v1 y para la re-cotizacion: si ya hay versiones, crea la
  // siguiente. Rechazada y vencida vuelven a 'enviada' con el mismo folio.
  async cotizar(scope: any, id: number, dto: CotizarDto) {
    const cotizacion = await this.buscar(scope, id);
    if (!puedeCotizar(cotizacion.estado)) {
      throw new BadRequestException(
        `Una cotización ${cotizacion.estado} no se puede cotizar`,
      );
    }

    const tienda_id = dto.tienda_id || cotizacion.tienda_id || scope.tienda_id;
    if (!tienda_id) {
      throw new BadRequestException('Selecciona la tienda que cobrará la cotización');
    }

    const precios = new Map<number, number>();
    for (const it of dto.items || []) {
      const precio = Number(it.precio_unitario);
      if (!Number.isFinite(precio) || precio < 0) {
        throw new BadRequestException('Precio invalido en la cotización');
      }
      precios.set(Number(it.producto_id), precio);
    }

    // Los renglones salen SIEMPRE de la version anterior (o de la solicitud
    // original, guardada como version 0): el cliente pidio esos productos y esas
    // cantidades, el negocio solo pone precios.
    const base = await this.itemsBase(cotizacion);
    const descuento = Number(dto.descuento || 0);
    const { items, subtotal, total } = calcularTotales(base, precios, descuento);

    if (!items.length) throw new BadRequestException('La cotización no tiene productos');
    if (subtotal <= 0) throw new BadRequestException('Captura al menos un precio mayor a cero');

    const dias = Number(dto.vigencia_dias || (await this.vigenciaDeTienda(cotizacion)) || VIGENCIA_DEFAULT);
    const ahora = new Date();

    // La version nueva y el avance de la cotizacion (estado + version_actual +
    // tienda_id) tienen que ir o no ir juntos: una version huerfana (guardada sin
    // que version_actual/estado avancen) choca despues con el UNIQUE
    // (cotizacion_id, version) al reintentar y deja el link publico / la aceptacion
    // mostrando todavia la version (y los precios) anteriores.
    const { cotizacion: cotizacionGuardada, version } = await this.cotRepo.manager.transaction(
      async (manager) => {
        const version = await manager.save(CotizacionVersion, {
          cotizacion_id: cotizacion.id,
          version: cotizacion.version_actual + 1,
          items,
          subtotal,
          descuento,
          total,
          vigencia_hasta: vigenciaHasta(ahora, dias),
          mensaje_cliente: dto.mensaje_cliente || null,
          enviada_at: ahora,
          respuesta: null,
          respuesta_motivo: null,
          respondida_at: null,
          respondida_ip: null,
        });

        cotizacion.estado = 'enviada';
        cotizacion.version_actual = version.version;
        cotizacion.tienda_id = tienda_id;
        const cotizacionGuardada = await manager.save(Cotizacion, cotizacion);

        return { cotizacion: cotizacionGuardada, version };
      },
    );

    return { cotizacion: cotizacionGuardada, version };
  }

  private async itemsBase(c: Cotizacion): Promise<CotizacionItem[]> {
    const ultima = await this.verRepo.findOne({
      where: { cotizacion_id: c.id },
      order: { version: 'DESC' },
    });
    return (ultima?.items as CotizacionItem[]) || [];
  }

  private async vigenciaDeTienda(c: Cotizacion): Promise<number | null> {
    const config: any = await this.configRepo.findOne({ where: { empresa_id: c.empresa_id } });
    const dias = Number(config?.preferencias?.cotizaciones?.vigencia_dias || 0);
    return dias > 0 ? dias : null;
  }

  async cerrar(scope: any, id: number, motivo: string) {
    const c = await this.buscar(scope, id);
    if (c.estado === 'aceptada') {
      throw new BadRequestException('Una cotización aceptada ya generó su pedido');
    }
    c.estado = 'cerrada';
    c.motivo_cierre = motivo || null;
    return this.cotRepo.save(c);
  }

  async actualizarNotas(scope: any, id: number, notas_internas: string) {
    const c = await this.buscar(scope, id);
    c.notas_internas = notas_internas;
    return this.cotRepo.save(c);
  }
}
