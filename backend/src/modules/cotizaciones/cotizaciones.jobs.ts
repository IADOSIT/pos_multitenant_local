import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CotizacionesService } from './cotizaciones.service';

@Injectable()
export class CotizacionesJobs {
  private readonly log = new Logger('CotizacionesJobs');

  constructor(
    @InjectDataSource() private ds: DataSource,
    private service: CotizacionesService,
  ) {}

  // Una cotizacion enviada cuya version vigente ya expiro deja de poder
  // aceptarse. No se cierra: re-cotizar la reabre con el mismo folio.
  @Cron(CronExpression.EVERY_HOUR)
  async marcarVencidas(): Promise<void> {
    const r = await this.ds.query(
      `UPDATE cotizaciones c
         JOIN cotizacion_versiones v
           ON v.cotizacion_id = c.id AND v.version = c.version_actual
        SET c.estado = 'vencida', c.updated_at = NOW()
      WHERE c.estado = 'enviada'
        AND v.respuesta IS NULL
        AND v.vigencia_hasta < CURDATE()`,
    );
    if (r?.affectedRows) this.log.warn(`Cotizaciones vencidas: ${r.affectedRows}`);
  }

  // Red de seguridad, no el camino normal: si la llamada interna de la tienda no
  // llego (POS caido, particion de red), la aceptacion ya quedo escrita en la
  // base y aqui se materializa el pedido que falto.
  @Cron(CronExpression.EVERY_MINUTE)
  async materializarPendientes(): Promise<void> {
    const filas = await this.ds.query(
      `SELECT id FROM cotizaciones
        WHERE estado = 'aceptada' AND pedido_id IS NULL
        ORDER BY updated_at ASC
        LIMIT 20`,
    );
    for (const f of filas) {
      try {
        const r = await this.service.materializarPedido(f.id);
        this.log.log(`Cotización ${f.id} materializada como pedido ${r.folio || r.pedido_id}`);
      } catch (e: any) {
        this.log.error(`Cotización ${f.id} no se pudo materializar: ${e.message}`);
        // Una fila que siempre falla (p.ej. una cotizacion sin tienda_id
        // derivable) no puede quedarse permanentemente a la cabeza de la cola:
        // el SELECT de arriba ordena por updated_at ASC, y sin esto la misma
        // fila rota volveria a ganar los 20 lugares del LIMIT en cada corrida,
        // bloqueando para siempre a las aceptaciones reales que llegan detras.
        // Tocar updated_at la manda al fondo, dejando avanzar al resto; ella
        // misma se reintenta igual, una vez por vuelta completa a la cola en
        // vez de una vez por minuto.
        await this.ds
          .query(`UPDATE cotizaciones SET updated_at = NOW() WHERE id = ?`, [f.id])
          .catch(() => {});
      }
    }
  }
}
