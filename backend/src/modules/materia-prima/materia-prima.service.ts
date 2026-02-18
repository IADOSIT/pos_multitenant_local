import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MateriaPrima } from './materia-prima.entity';
import { parse } from 'csv-parse/sync';

@Injectable()
export class MateriaPrimaService {
  constructor(
    @InjectRepository(MateriaPrima) private repo: Repository<MateriaPrima>,
  ) {}

  findAll(scope: any) {
    return this.repo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
      order: { categoria: 'ASC', nombre: 'ASC' },
    });
  }

  findOne(id: number, scope: any) {
    return this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
  }

  async create(data: Partial<MateriaPrima>, scope: any) {
    return this.repo.save(this.repo.create({
      ...data,
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      tienda_id: scope.tienda_id,
    }));
  }

  async update(id: number, data: Partial<MateriaPrima>, scope: any) {
    const item = await this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
    if (!item) throw new BadRequestException('No encontrado');
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async delete(id: number, scope: any) {
    await this.repo.delete({ id, tenant_id: scope.tenant_id } as any);
    return { deleted: true };
  }

  async deleteAll(scope: any) {
    const result = await this.repo.delete({ tenant_id: scope.tenant_id, empresa_id: scope.empresa_id });
    return { deleted: result.affected || 0 };
  }

  getCSVTemplate(): string {
    return 'sku,nombre,descripcion,categoria,unidad,costo,stock_actual,stock_minimo,proveedor,notas\n'
      + 'MP-CAM001,Camaron Grande,Camaron fresco 16/20,Mariscos,kg,185.00,50,10,Proveedor Mar,\n'
      + 'MP-LIM001,Limon Verde,Limon fresco,Verduras,kg,25.00,40,10,Central Abastos,';
  }

  async exportCSV(scope: any): Promise<string> {
    const items = await this.findAll(scope);
    let csv = 'sku,nombre,descripcion,categoria,unidad,costo,stock_actual,stock_minimo,proveedor,notas\n';
    for (const i of items) {
      csv += `${i.sku},"${i.nombre}","${i.descripcion || ''}","${i.categoria || ''}",${i.unidad},${i.costo || 0},${i.stock_actual || 0},${i.stock_minimo || 0},"${i.proveedor || ''}","${i.notas || ''}"\n`;
    }
    return csv;
  }

  private decodeCSV(buffer: Buffer): string {
    let str = buffer.toString('utf-8');
    if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
    if (str.includes('\ufffd')) str = buffer.toString('latin1');
    return str;
  }

  private detectDelimiter(csvStr: string): string {
    const firstLine = csvStr.split(/\r?\n/)[0] || '';
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    if (semicolons > commas && semicolons > tabs) return ';';
    if (tabs > commas && tabs > semicolons) return '\t';
    return ',';
  }

  async importCSV(buffer: Buffer, scope: any) {
    const csvStr = this.decodeCSV(buffer);
    const delimiter = this.detectDelimiter(csvStr);
    const normalizeKey = (k: string) => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');

    const rawRecords = parse(csvStr, { columns: true, skip_empty_lines: true, trim: true, delimiter });
    const records = rawRecords.map((r: any) => {
      const norm: any = {};
      for (const [k, v] of Object.entries(r)) norm[normalizeKey(k)] = v;
      return norm;
    });

    const results = { success: 0, updated: 0, errors: [] as any[], total: records.length, columns: [] as string[] };

    if (records.length > 0) {
      results.columns = Object.keys(records[0]);
    }

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        if (!row.sku || !row.nombre) {
          results.errors.push({ fila: i + 2, error: 'sku y nombre son obligatorios' });
          continue;
        }

        const existing = await this.repo.findOne({
          where: { sku: row.sku, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
        });

        const data: Partial<MateriaPrima> = {
          tenant_id: scope.tenant_id,
          empresa_id: scope.empresa_id,
          tienda_id: scope.tienda_id,
          sku: row.sku,
          nombre: row.nombre,
          descripcion: row.descripcion || undefined,
          categoria: row.categoria || undefined,
          unidad: row.unidad || 'pza',
          costo: row.costo ? parseFloat(row.costo) : 0,
          stock_actual: row.stock_actual ? parseFloat(row.stock_actual) : 0,
          stock_minimo: row.stock_minimo ? parseFloat(row.stock_minimo) : 0,
          proveedor: row.proveedor || undefined,
          notas: row.notas || undefined,
        };

        if (existing) {
          await this.repo.save({ ...existing, ...data });
          results.updated++;
        } else {
          await this.repo.save(this.repo.create(data));
          results.success++;
        }
      } catch (err: any) {
        results.errors.push({ fila: i + 2, error: err.message });
      }
    }
    return results;
  }
}
