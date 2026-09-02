import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransferenciaInventario, TransferenciaEstado } from './transferencia.entity';
import { Producto } from '../productos/producto.entity';
import { EmpresasService } from '../empresas/empresas.service';

// Consecutivo por empresa (una transferencia siempre va entre tiendas de la misma
// empresa). Antes era timestamp + random: unico, pero no se podia ordenar ni comparar.
// Se apoya en el `manager` de la transaccion que ya envuelve la creacion, asi que el
// contador y el movimiento de stock siguen siendo atomicos.
async function generarFolio(manager: EntityManager, empresa_id: number): Promise<{ folio: string; numero: number }> {
  const [empresa] = await manager.query(
    'SELECT folio_transferencia_counter FROM empresas WHERE id = ? FOR UPDATE',
    [empresa_id],
  );
  const newCounter = (empresa?.folio_transferencia_counter || 0) + 1;
  await manager.query(
    'UPDATE empresas SET folio_transferencia_counter = ? WHERE id = ?',
    [newCounter, empresa_id],
  );
  return { folio: `TR-${String(newCounter).padStart(6, '0')}`, numero: newCounter };
}

@Injectable()
export class TransferenciasService {
  constructor(
    @InjectRepository(TransferenciaInventario) private repo: Repository<TransferenciaInventario>,
    @InjectRepository(Producto) private prodRepo: Repository<Producto>,
    @InjectDataSource() private dataSource: DataSource,
    private empresasService: EmpresasService,
  ) {}

  // Las transferencias directas requieren que la empresa tenga tanto "inventario_compartido"
  // (el stock por tienda en producto_tienda es el que existe/es confiable) como el toggle
  // independiente "transferencias_activo" prendidos.
  private async verificarHabilitado(empresa_id: number) {
    const { inventario_compartido, transferencias_activo } = await this.empresasService.getConfigEspecial(empresa_id);
    if (!inventario_compartido || !transferencias_activo) {
      throw new BadRequestException('Las transferencias entre tiendas no estan habilitadas para esta empresa');
    }
  }

  async crear(data: { tienda_destino_id: number; producto_id: number; cantidad: number; notas?: string }, scope: any) {
    await this.verificarHabilitado(scope.empresa_id);
    if (!scope.tienda_id) throw new BadRequestException('Selecciona una tienda de origen');
    if (Number(data.tienda_destino_id) === Number(scope.tienda_id)) {
      throw new BadRequestException('La tienda destino debe ser distinta a la tienda origen');
    }
    const cantidad = Number(data.cantidad);
    if (!cantidad || cantidad <= 0) throw new BadRequestException('Cantidad invalida');

    const [tiendaDestino] = await this.repo.manager.query(
      'SELECT id, nombre FROM tiendas WHERE id = ? AND empresa_id = ? AND activo = 1',
      [data.tienda_destino_id, scope.empresa_id],
    );
    if (!tiendaDestino) throw new NotFoundException('Tienda destino no encontrada');
    const [tiendaOrigen] = await this.repo.manager.query('SELECT id, nombre FROM tiendas WHERE id = ?', [scope.tienda_id]);

    const producto = await this.prodRepo.findOne({ where: { id: data.producto_id, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    return this.dataSource.transaction(async (manager) => {
      const [pt] = await manager.query(
        'SELECT id, stock FROM producto_tienda WHERE producto_id = ? AND tienda_id = ? FOR UPDATE',
        [producto.id, scope.tienda_id],
      );
      const stockDisponible = Number(pt?.stock || 0);
      if (stockDisponible < cantidad) {
        throw new BadRequestException(`Stock insuficiente en esta tienda (disponible: ${stockDisponible})`);
      }
      const stockNuevo = stockDisponible - cantidad;
      await manager.query('UPDATE producto_tienda SET stock = ? WHERE id = ?', [stockNuevo, pt.id]);

      const { folio, numero: numero_orden } = await generarFolio(manager, scope.empresa_id);
      await manager.query(
        `INSERT INTO movimientos_inventario
          (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
           tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
         VALUES (?, ?, ?, ?, ?, ?, 'salida', ?, ?, ?, ?, ?, ?)`,
        [
          scope.tenant_id, scope.empresa_id, scope.tienda_id,
          producto.id, producto.nombre, producto.sku || '',
          cantidad, stockDisponible, stockNuevo,
          `Transferencia ${folio} a ${tiendaDestino.nombre}`,
          scope.id || scope.sub, scope.nombre || 'Sistema',
        ],
      );

      return manager.getRepository(TransferenciaInventario).save(manager.getRepository(TransferenciaInventario).create({
        tenant_id: scope.tenant_id,
        empresa_id: scope.empresa_id,
        tienda_origen_id: scope.tienda_id,
        tienda_origen_nombre: tiendaOrigen?.nombre || '',
        tienda_destino_id: data.tienda_destino_id,
        tienda_destino_nombre: tiendaDestino.nombre,
        folio,
        numero_orden,
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        producto_sku: producto.sku || '',
        cantidad,
        notas: data.notas || undefined,
        estado: TransferenciaEstado.PENDIENTE,
        usuario_envio_id: scope.id || scope.sub,
        usuario_envio_nombre: scope.nombre || 'Sistema',
      }));
    });
  }

  // Transferencias que esta tienda debe recibir (confirmar llegada de mercancia).
  listPendientesRecibir(scope: any) {
    return this.repo.find({
      where: { empresa_id: scope.empresa_id, tienda_destino_id: scope.tienda_id, estado: TransferenciaEstado.PENDIENTE },
      order: { created_at: 'ASC' },
    });
  }

  // Transferencias enviadas por esta tienda (para dar seguimiento), cualquier estado.
  listEnviadas(scope: any) {
    return this.repo.find({
      where: { empresa_id: scope.empresa_id, tienda_origen_id: scope.tienda_id },
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  async buscarPorFolio(folio: string, scope: any) {
    const t = await this.repo.findOne({ where: { folio, empresa_id: scope.empresa_id } });
    if (!t) throw new NotFoundException('No se encontro ninguna transferencia con ese folio');
    return t;
  }

  async recibir(id: number, scope: any) {
    const t = await this.repo.findOne({ where: { id, empresa_id: scope.empresa_id } });
    if (!t) throw new NotFoundException('Transferencia no encontrada');
    if (t.estado !== TransferenciaEstado.PENDIENTE) throw new BadRequestException('Esta transferencia ya fue procesada');
    const adminRoles = ['superadmin', 'admin', 'manager'];
    if (t.tienda_destino_id !== scope.tienda_id && !adminRoles.includes(scope.rol)) {
      throw new ForbiddenException('Esta transferencia se recibe en otra tienda');
    }

    return this.dataSource.transaction(async (manager) => {
      const [pt] = await manager.query(
        'SELECT id, stock FROM producto_tienda WHERE producto_id = ? AND tienda_id = ? FOR UPDATE',
        [t.producto_id, t.tienda_destino_id],
      );
      const stockAnterior = Number(pt?.stock || 0);
      const stockNuevo = stockAnterior + Number(t.cantidad);
      if (pt) {
        await manager.query('UPDATE producto_tienda SET stock = ? WHERE id = ?', [stockNuevo, pt.id]);
      } else {
        await manager.query(
          'INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, stock, disponible) VALUES (?, ?, ?, ?, 1)',
          [t.tenant_id, t.tienda_destino_id, t.producto_id, stockNuevo],
        );
      }
      await manager.query(
        `INSERT INTO movimientos_inventario
          (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
           tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
         VALUES (?, ?, ?, ?, ?, ?, 'entrada', ?, ?, ?, ?, ?, ?)`,
        [
          t.tenant_id, t.empresa_id, t.tienda_destino_id,
          t.producto_id, t.producto_nombre, t.producto_sku || '',
          Number(t.cantidad), stockAnterior, stockNuevo,
          `Transferencia recibida ${t.folio} de ${t.tienda_origen_nombre}`,
          scope.id || scope.sub, scope.nombre || 'Sistema',
        ],
      );
      t.estado = TransferenciaEstado.RECIBIDO;
      t.usuario_recibio_id = scope.id || scope.sub;
      t.usuario_recibio_nombre = scope.nombre || 'Sistema';
      t.recibido_at = new Date();
      return manager.getRepository(TransferenciaInventario).save(t);
    });
  }

  // Cancelar una transferencia en transito (no recibida): regresa el stock a la tienda origen.
  async cancelar(id: number, motivo: string, scope: any) {
    const t = await this.repo.findOne({ where: { id, empresa_id: scope.empresa_id } });
    if (!t) throw new NotFoundException('Transferencia no encontrada');
    if (t.estado !== TransferenciaEstado.PENDIENTE) throw new BadRequestException('Esta transferencia ya fue procesada');
    const adminRoles = ['superadmin', 'admin', 'manager'];
    if (t.tienda_origen_id !== scope.tienda_id && !adminRoles.includes(scope.rol)) {
      throw new ForbiddenException('Solo la tienda que envio la transferencia puede cancelarla');
    }

    return this.dataSource.transaction(async (manager) => {
      const [pt] = await manager.query(
        'SELECT id, stock FROM producto_tienda WHERE producto_id = ? AND tienda_id = ? FOR UPDATE',
        [t.producto_id, t.tienda_origen_id],
      );
      const stockAnterior = Number(pt?.stock || 0);
      const stockNuevo = stockAnterior + Number(t.cantidad);
      if (pt) {
        await manager.query('UPDATE producto_tienda SET stock = ? WHERE id = ?', [stockNuevo, pt.id]);
      } else {
        await manager.query(
          'INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, stock, disponible) VALUES (?, ?, ?, ?, 1)',
          [t.tenant_id, t.tienda_origen_id, t.producto_id, stockNuevo],
        );
      }
      await manager.query(
        `INSERT INTO movimientos_inventario
          (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
           tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
         VALUES (?, ?, ?, ?, ?, ?, 'entrada', ?, ?, ?, ?, ?, ?)`,
        [
          t.tenant_id, t.empresa_id, t.tienda_origen_id,
          t.producto_id, t.producto_nombre, t.producto_sku || '',
          Number(t.cantidad), stockAnterior, stockNuevo,
          `Cancelacion transferencia ${t.folio}: ${motivo || 'sin motivo'}`,
          scope.id || scope.sub, scope.nombre || 'Sistema',
        ],
      );
      t.estado = TransferenciaEstado.CANCELADO;
      return manager.getRepository(TransferenciaInventario).save(t);
    });
  }
}
