import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EncuestaServicio } from './encuesta.entity';

@Injectable()
export class EncuestasService {
  constructor(
    @InjectRepository(EncuestaServicio) private repo: Repository<EncuestaServicio>,
  ) {}

  create(data: Partial<EncuestaServicio>) {
    return this.repo.save(this.repo.create(data));
  }

  findByPedido(pedido_id: number) {
    return this.repo.findOne({ where: { pedido_id } });
  }

  async responder(pedido_id: number, data: {
    calificacion_servicio: number;
    calificacion_comida: number;
    comentario?: string;
  }) {
    const encuesta = await this.repo.findOne({ where: { pedido_id } });
    if (!encuesta) return null;
    if (encuesta.completada) return encuesta;

    encuesta.calificacion_servicio = data.calificacion_servicio;
    encuesta.calificacion_comida = data.calificacion_comida;
    encuesta.comentario = data.comentario || null;
    encuesta.completada = true;
    return this.repo.save(encuesta);
  }

  async getKPIs(scope: any, desde?: string, hasta?: string) {
    const where: any = {
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      tienda_id: scope.tienda_id,
      completada: true,
    };

    if (desde && hasta) {
      where.created_at = Between(new Date(desde), new Date(hasta + 'T23:59:59'));
    }

    const encuestas = await this.repo.find({ where });

    if (!encuestas.length) return { total: 0, promedio_servicio: 0, promedio_comida: 0, por_mesero: [] };

    const promedio_servicio = encuestas.reduce((a, e) => a + e.calificacion_servicio, 0) / encuestas.length;
    const promedio_comida = encuestas.reduce((a, e) => a + e.calificacion_comida, 0) / encuestas.length;

    // Agrupar por mesero
    const porMesero: Record<number, { mesero_nombre: string; total: number; suma_servicio: number; suma_comida: number }> = {};
    for (const e of encuestas) {
      if (!e.mesero_id) continue;
      if (!porMesero[e.mesero_id]) {
        porMesero[e.mesero_id] = { mesero_nombre: e.mesero_nombre || 'Sin nombre', total: 0, suma_servicio: 0, suma_comida: 0 };
      }
      porMesero[e.mesero_id].total++;
      porMesero[e.mesero_id].suma_servicio += e.calificacion_servicio;
      porMesero[e.mesero_id].suma_comida += e.calificacion_comida;
    }

    const por_mesero = Object.entries(porMesero).map(([id, d]) => ({
      mesero_id: Number(id),
      mesero_nombre: d.mesero_nombre,
      total_encuestas: d.total,
      promedio_servicio: +(d.suma_servicio / d.total).toFixed(2),
      promedio_comida: +(d.suma_comida / d.total).toFixed(2),
    }));

    return {
      total: encuestas.length,
      promedio_servicio: +promedio_servicio.toFixed(2),
      promedio_comida: +promedio_comida.toFixed(2),
      por_mesero,
    };
  }

  findAll(scope: any, limit = 50) {
    return this.repo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, tienda_id: scope.tienda_id },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
