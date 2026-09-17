import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async listar(scope: any, filtros: { estado?: string; q?: string } = {}) {
    const where: any = { empresa_id: scope.empresa_id, tenant_id: scope.tenant_id };
    if (filtros.estado) where.estado = filtros.estado;
    return this.cotRepo.find({ where, order: { created_at: 'DESC' }, take: 200 });
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

    const version = await this.verRepo.save(
      this.verRepo.create({
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
      }),
    );

    cotizacion.estado = 'enviada';
    cotizacion.version_actual = version.version;
    cotizacion.tienda_id = tienda_id;
    await this.cotRepo.save(cotizacion);

    return { cotizacion, version };
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
