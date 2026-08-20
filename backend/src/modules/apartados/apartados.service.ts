import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ApartadoInventario, ApartadoEstado } from './apartado.entity';

@Injectable()
export class ApartadosService {
  constructor(
    @InjectRepository(ApartadoInventario) private repo: Repository<ApartadoInventario>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // Llamado por VentasService DENTRO de la misma transaccion que descuenta el stock de la
  // tienda destino, para que el apartado quede atomico con el movimiento de inventario.
  async crearDentroDeTransaccion(manager: EntityManager, data: {
    tenant_id: number; empresa_id: number; tienda_origen_id: number; tienda_destino_id: number;
    venta_id: number; folio: string; producto_id: number; producto_nombre: string; cantidad: number;
    cliente_nombre?: string; cliente_telefono?: string; usuario_creo_id?: number; usuario_creo_nombre?: string;
  }) {
    return manager.getRepository(ApartadoInventario).save(manager.getRepository(ApartadoInventario).create({
      ...data,
      estado: ApartadoEstado.PENDIENTE,
    }));
  }

  // Apartados pendientes que esta tienda debe surtir (recoger/entregar).
  listPendientes(scope: any) {
    return this.repo.find({
      where: { empresa_id: scope.empresa_id, tienda_destino_id: scope.tienda_id, estado: ApartadoEstado.PENDIENTE },
      order: { created_at: 'ASC' },
    });
  }

  async buscarPorFolio(folio: string, scope: any) {
    const apartado = await this.repo.findOne({ where: { folio, empresa_id: scope.empresa_id } });
    if (!apartado) throw new NotFoundException('No se encontro ningun apartado con ese folio');
    return apartado;
  }

  async entregar(id: number, scope: any) {
    const apartado = await this.repo.findOne({ where: { id, empresa_id: scope.empresa_id } });
    if (!apartado) throw new NotFoundException('Apartado no encontrado');
    if (apartado.estado !== ApartadoEstado.PENDIENTE) throw new BadRequestException('Este apartado ya fue procesado');
    const adminRoles = ['superadmin', 'admin', 'manager'];
    if (apartado.tienda_destino_id !== scope.tienda_id && !adminRoles.includes(scope.rol)) {
      throw new ForbiddenException('Este apartado se entrega en otra tienda');
    }
    apartado.estado = ApartadoEstado.ENTREGADO;
    apartado.usuario_entrego_id = scope.id || scope.sub;
    apartado.usuario_entrego_nombre = scope.nombre || 'Sistema';
    apartado.entregado_at = new Date();
    return this.repo.save(apartado);
  }

  // Cancelar un apartado no entregado: regresa el stock reservado a la tienda destino.
  async cancelar(id: number, motivo: string, scope: any) {
    const apartado = await this.repo.findOne({ where: { id, empresa_id: scope.empresa_id } });
    if (!apartado) throw new NotFoundException('Apartado no encontrado');
    if (apartado.estado !== ApartadoEstado.PENDIENTE) throw new BadRequestException('Este apartado ya fue procesado');

    return this.dataSource.transaction(async (manager) => {
      const [pt] = await manager.query(
        'SELECT id, stock FROM producto_tienda WHERE producto_id = ? AND tienda_id = ? FOR UPDATE',
        [apartado.producto_id, apartado.tienda_destino_id],
      );
      const stockAnterior = Number(pt?.stock || 0);
      const stockNuevo = stockAnterior + Number(apartado.cantidad);
      if (pt) {
        await manager.query('UPDATE producto_tienda SET stock = ? WHERE id = ?', [stockNuevo, pt.id]);
      } else {
        await manager.query(
          'INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, stock, disponible) VALUES (?, ?, ?, ?, 1)',
          [apartado.tenant_id, apartado.tienda_destino_id, apartado.producto_id, stockNuevo],
        );
      }
      await manager.query(
        `INSERT INTO movimientos_inventario
          (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
           tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
         VALUES (?, ?, ?, ?, ?, '', 'entrada', ?, ?, ?, ?, ?, ?)`,
        [
          apartado.tenant_id, apartado.empresa_id, apartado.tienda_destino_id,
          apartado.producto_id, apartado.producto_nombre,
          Number(apartado.cantidad), stockAnterior, stockNuevo,
          `Cancelacion apartado ${apartado.folio}: ${motivo || 'sin motivo'}`,
          scope.id || scope.sub, scope.nombre || 'Sistema',
        ],
      );
      apartado.estado = ApartadoEstado.CANCELADO;
      return manager.getRepository(ApartadoInventario).save(apartado);
    });
  }
}
