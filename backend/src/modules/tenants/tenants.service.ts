import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private repo: Repository<Tenant>,
    private dataSource: DataSource,
  ) {}

  findAll() {
    return this.repo.find({ order: { nombre: 'ASC' }, relations: ['empresas'] });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['empresas', 'empresas.tiendas'] });
  }

  async create(data: Partial<Tenant>) {
    const slug = data.nombre!.toLowerCase().replace(/\s+/g, '-');
    const exists = await this.repo.findOne({ where: { slug } });
    if (exists) throw new BadRequestException('Ya existe un tenant con ese nombre');
    return this.repo.save(this.repo.create({ ...data, slug }));
  }

  async update(id: number, data: Partial<Tenant>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async softDelete(id: number) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // Delete children in order (deepest first)
      await qr.query('DELETE FROM venta_detalles WHERE venta_id IN (SELECT id FROM ventas WHERE tenant_id = ?)', [id]);
      await qr.query('DELETE FROM ventas WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM pedido_detalles WHERE pedido_id IN (SELECT id FROM pedidos WHERE tenant_id = ?)', [id]);
      await qr.query('DELETE FROM pedidos WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM movimientos_caja WHERE caja_id IN (SELECT id FROM cajas WHERE tenant_id = ?)', [id]);
      await qr.query('DELETE FROM cajas WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM venta_pagos WHERE venta_id IN (SELECT id FROM ventas WHERE tenant_id = ?)', [id]);
      await qr.query('DELETE FROM materia_prima WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM movimientos_inventario WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM producto_tienda WHERE producto_id IN (SELECT id FROM productos WHERE tenant_id = ?)', [id]);
      await qr.query('DELETE FROM productos WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM categorias WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM ticket_configs WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM auditoria WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM licencias WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM tiendas WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM users WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM empresas WHERE tenant_id = ?', [id]);
      await qr.query('DELETE FROM tenants WHERE id = ?', [id]);
      await qr.commitTransaction();
      return { deleted: true };
    } catch (err) {
      await qr.rollbackTransaction();
      throw new BadRequestException('Error al eliminar tenant: ' + (err as any).message);
    } finally {
      await qr.release();
    }
  }
}
