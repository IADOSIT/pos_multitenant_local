import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as ExcelJS from 'exceljs';
import { BackupConfig } from './entities/backup-config.entity';
import { BackupLog } from './entities/backup-log.entity';

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  readonly backupsDir: string;

  constructor(
    @InjectRepository(BackupConfig) private configRepo: Repository<BackupConfig>,
    @InjectRepository(BackupLog) private logRepo: Repository<BackupLog>,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    // Carpeta de respaldos en la raíz de instalación (C:\POS-iaDoS\respaldos\)
    // En dev: <proyecto>/respaldos/
    this.backupsDir = path.join(process.cwd(), '..', 'respaldos');
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  async onModuleInit() {
    const count = await this.configRepo.count();
    if (count === 0) {
      await this.configRepo.save(this.configRepo.create({}));
    }
  }

  async getConfig(): Promise<BackupConfig> {
    let config = await this.configRepo.findOne({ where: { id: 1 } });
    if (!config) config = await this.configRepo.save(this.configRepo.create({}));
    return config;
  }

  async updateConfig(data: Partial<BackupConfig>): Promise<BackupConfig> {
    const config = await this.getConfig();
    Object.assign(config, data);
    return this.configRepo.save(config);
  }

  async getLogs(limit = 60): Promise<BackupLog[]> {
    return this.logRepo.find({ order: { created_at: 'DESC' }, take: limit });
  }

  listFiles(): { archivo: string; tamano: number; fecha: Date }[] {
    try {
      return fs.readdirSync(this.backupsDir)
        .filter((f) => f.endsWith('.sql') || f.endsWith('.xlsx'))
        .map((f) => {
          const stat = fs.statSync(path.join(this.backupsDir, f));
          return { archivo: f, tamano: stat.size, fecha: stat.mtime };
        })
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    } catch {
      return [];
    }
  }

  private getMysqldumpPath(): string {
    const candidates = [
      path.join('C:', 'POS-iaDoS', 'mariadb', 'bin', 'mysqldump.exe'),
      path.join(process.cwd(), '..', 'mariadb', 'bin', 'mysqldump.exe'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return 'mysqldump';
  }

  private getMysqlPath(): string {
    const candidates = [
      path.join('C:', 'POS-iaDoS', 'mariadb', 'bin', 'mysql.exe'),
      path.join(process.cwd(), '..', 'mariadb', 'bin', 'mysql.exe'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return 'mysql';
  }

  private realizarBackupDB(): Promise<{ archivo: string; tamano: number }> {
    const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-db-${fecha}.sql`;
    const filepath = path.join(this.backupsDir, filename);

    const mysqldump = this.getMysqldumpPath();
    const args = [
      `-h${process.env.DB_HOST || 'localhost'}`,
      `-P${process.env.DB_PORT || '3306'}`,
      `-u${process.env.DB_USERNAME || 'pos_iados'}`,
      `--password=${process.env.DB_PASSWORD || 'pos_iados_2024'}`,
      '--skip-lock-tables',   // evita FLUSH TABLES (requiere RELOAD privilege)
      '--no-tablespaces',
      '--routines',
      process.env.DB_NAME || 'pos_iados',
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn(mysqldump, args, { windowsHide: true });
      const out = fs.createWriteStream(filepath);
      proc.stdout.pipe(out);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => {
        out.close();
        // Ignorar warnings de password (exit code 0 con warnings en stderr es OK)
        const realError = stderr
          .split('\n')
          .filter((l) => l.includes('[ERROR]'))
          .join(' ');
        if (code !== 0 || realError) {
          try { fs.unlinkSync(filepath); } catch {}
          return reject(new Error(`mysqldump: ${(realError || stderr).substring(0, 300)}`));
        }
        const stats = fs.statSync(filepath);
        resolve({ archivo: filename, tamano: stats.size });
      });
      proc.on('error', (e) => reject(new Error(`mysqldump no encontrado: ${e.message}`)));
    });
  }

  private async realizarBackupExcel(): Promise<{ archivo: string; tamano: number }> {
    const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-excel-${fecha}.xlsx`;
    const filepath = path.join(this.backupsDir, filename);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'POS-iaDoS';
    wb.created = new Date();

    // Sheet: Ventas
    const wsV = wb.addWorksheet('Ventas');
    wsV.columns = [
      { header: 'Folio', key: 'folio', width: 16 },
      { header: 'Fecha', key: 'created_at', width: 20 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Impuestos', key: 'impuestos', width: 12 },
      { header: 'Descuento', key: 'descuento', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Metodo Pago', key: 'metodo_pago', width: 15 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Cajero', key: 'cajero', width: 22 },
      { header: 'Tienda', key: 'tienda', width: 22 },
    ];
    wsV.getRow(1).font = { bold: true };
    try {
      const ventas = await this.dataSource.query(
        `SELECT v.folio, v.created_at, v.subtotal, v.impuestos, v.descuento, v.total,
                v.metodo_pago, v.estado,
                u.nombre AS cajero, t.nombre AS tienda
         FROM ventas v
         LEFT JOIN users u ON v.usuario_id = u.id
         LEFT JOIN tiendas t ON v.tienda_id = t.id
         ORDER BY v.created_at DESC`,
      );
      wsV.addRows(ventas);
    } catch (e) {
      wsV.addRow({ folio: `Error: ${e.message}` });
    }

    // Sheet: Detalle Ventas
    const wsD = wb.addWorksheet('Detalle Ventas');
    wsD.columns = [
      { header: 'Folio Venta', key: 'folio', width: 16 },
      { header: 'Producto', key: 'producto_nombre', width: 32 },
      { header: 'SKU', key: 'producto_sku', width: 14 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Precio Unitario', key: 'precio_unitario', width: 14 },
      { header: 'Descuento', key: 'descuento', width: 12 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
    ];
    wsD.getRow(1).font = { bold: true };
    try {
      const detalles = await this.dataSource.query(
        `SELECT v.folio, d.producto_nombre, d.producto_sku, d.cantidad,
                d.precio_unitario, d.descuento, d.subtotal
         FROM venta_detalles d
         JOIN ventas v ON d.venta_id = v.id
         ORDER BY v.created_at DESC, d.id`,
      );
      wsD.addRows(detalles);
    } catch (e) {
      wsD.addRow({ folio: `Error: ${e.message}` });
    }

    // Sheet: Productos
    const wsP = wb.addWorksheet('Productos');
    wsP.columns = [
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Nombre', key: 'nombre', width: 32 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Precio', key: 'precio', width: 12 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Activo', key: 'activo', width: 8 },
    ];
    wsP.getRow(1).font = { bold: true };
    try {
      const productos = await this.dataSource.query(
        `SELECT p.sku, p.nombre, c.nombre AS categoria, p.precio, p.stock, p.activo
         FROM productos p
         LEFT JOIN categorias c ON p.categoria_id = c.id
         ORDER BY c.nombre, p.nombre`,
      );
      wsP.addRows(productos);
    } catch (e) {
      wsP.addRow({ sku: `Error: ${e.message}` });
    }

    // Sheet: Inventario
    const wsI = wb.addWorksheet('Inventario');
    wsI.columns = [
      { header: 'Producto', key: 'producto', width: 32 },
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Stock Actual', key: 'stock', width: 14 },
      { header: 'Stock Min', key: 'stock_minimo', width: 12 },
      { header: 'Alerta', key: 'alerta_stock', width: 10 },
    ];
    wsI.getRow(1).font = { bold: true };
    try {
      const inv = await this.dataSource.query(
        `SELECT p.nombre AS producto, p.sku, p.stock, p.stock_minimo, p.alerta_stock
         FROM productos p WHERE p.controla_inventario = 1 ORDER BY p.nombre`,
      );
      wsI.addRows(inv);
    } catch {
      // tabla o columnas pueden no existir — omitir silenciosamente
    }

    await wb.xlsx.writeFile(filepath);

    // Copia fija en raíz: respaldo-diario.xlsx (sobreescribe cada vez)
    // Así siempre hay un archivo actualizado y fácil de encontrar en C:\POS-iaDoS\
    try {
      const raiz = path.join(process.cwd(), '..');
      fs.copyFileSync(filepath, path.join(raiz, 'respaldo-diario.xlsx'));
    } catch { /* ignorar si no hay permisos */ }

    const stats = fs.statSync(filepath);
    return { archivo: filename, tamano: stats.size };
  }

  async ejecutarBackup(tipo: 'db' | 'excel' | 'completo'): Promise<BackupLog[]> {
    const config = await this.getConfig();
    const logs: BackupLog[] = [];

    const tipos: ('db' | 'excel')[] = [];
    if (tipo === 'db' || tipo === 'completo') tipos.push('db');
    if (tipo === 'excel' || tipo === 'completo') tipos.push('excel');

    for (const t of tipos) {
      const log = this.logRepo.create({ tipo });
      try {
        const result = t === 'db'
          ? await this.realizarBackupDB()
          : await this.realizarBackupExcel();

        log.tipo = t;
        log.archivo = result.archivo;
        log.tamano_bytes = result.tamano;
        log.estado = 'ok';

        if (config.onedrive_enabled && config.onedrive_carpeta) {
          try {
            const dest = path.join(config.onedrive_carpeta, result.archivo);
            fs.copyFileSync(path.join(this.backupsDir, result.archivo), dest);
            log.onedrive_copiado = true;
          } catch (e) {
            this.logger.warn(`OneDrive copy failed: ${e.message}`);
          }
        }
      } catch (e) {
        log.tipo = t;
        log.archivo = '';
        log.estado = 'error';
        log.error_msg = e.message;
      }
      await this.logRepo.save(log);
      logs.push(log);
    }

    config.ultimo_backup_at = new Date();
    config.ultimo_backup_estado = logs.every((l) => l.estado === 'ok') ? 'ok' : 'error';
    await this.configRepo.save(config);

    await this.limpiarAntiguos(config.retencion_dias);
    return logs;
  }

  async limpiarAntiguos(dias: number): Promise<void> {
    const cutoff = Date.now() - dias * 24 * 60 * 60 * 1000;
    try {
      const files = fs.readdirSync(this.backupsDir);
      for (const f of files) {
        const fp = path.join(this.backupsDir, f);
        if (fs.statSync(fp).mtimeMs < cutoff) {
          fs.unlinkSync(fp);
          await this.logRepo.delete({ archivo: f });
        }
      }
    } catch (e) {
      this.logger.warn(`Cleanup error: ${e.message}`);
    }
  }

  getFilePath(filename: string): string | null {
    const fp = path.join(this.backupsDir, path.basename(filename));
    return fs.existsSync(fp) ? fp : null;
  }

  async deleteLog(id: number): Promise<{ deleted: boolean }> {
    const log = await this.logRepo.findOne({ where: { id } });
    if (!log) return { deleted: false };
    const fp = path.join(this.backupsDir, log.archivo);
    try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
    await this.logRepo.remove(log);
    return { deleted: true };
  }

  async restaurarBackup(filename: string): Promise<{ ok: boolean; mensaje: string }> {
    const safe = path.basename(filename);
    if (!safe.endsWith('.sql')) {
      throw new Error('Solo se pueden restaurar archivos .sql');
    }
    const filepath = path.join(this.backupsDir, safe);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Archivo no encontrado: ${safe}`);
    }

    const mysql = this.getMysqlPath();
    const args = [
      `-h${process.env.DB_HOST || 'localhost'}`,
      `-P${process.env.DB_PORT || '3306'}`,
      `-u${process.env.DB_USERNAME || 'pos_iados'}`,
      `--password=${process.env.DB_PASSWORD || 'pos_iados_2024'}`,
      process.env.DB_NAME || 'pos_iados',
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn(mysql, args, { windowsHide: true });
      const input = fs.createReadStream(filepath);
      input.pipe(proc.stdin);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => {
        const realError = stderr
          .split('\n')
          .filter((l) => l.includes('[ERROR]'))
          .join(' ');
        if (code !== 0 || realError) {
          return reject(new Error(`mysql: ${(realError || stderr).substring(0, 300)}`));
        }
        this.logger.log(`Restauracion completada desde: ${safe}`);
        resolve({ ok: true, mensaje: `Base de datos restaurada desde ${safe}` });
      });
      proc.on('error', (e) => reject(new Error(`mysql no encontrado: ${e.message}`)));
    });
  }

  async limpiarDemoData(opciones: {
    ventas: boolean;
    pedidos: boolean;
    caja: boolean;
    inventario: boolean;
    productos?: boolean;
    categorias?: boolean;
  }): Promise<Record<string, number>> {
    const resultado: Record<string, number> = {};

    await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      if (opciones.ventas) {
        const [r1] = await this.dataSource.query('SELECT COUNT(*) AS c FROM venta_pagos');
        await this.dataSource.query('DELETE FROM venta_pagos');
        const [r2] = await this.dataSource.query('SELECT COUNT(*) AS c FROM venta_detalles');
        await this.dataSource.query('DELETE FROM venta_detalles');
        const [r3] = await this.dataSource.query('SELECT COUNT(*) AS c FROM ventas');
        await this.dataSource.query('DELETE FROM ventas');
        resultado.ventas = Number(r3.c);
        resultado.venta_detalles = Number(r2.c);
        resultado.venta_pagos = Number(r1.c);
      }

      if (opciones.pedidos) {
        const [r1] = await this.dataSource.query('SELECT COUNT(*) AS c FROM pedido_detalles');
        await this.dataSource.query('DELETE FROM pedido_detalles');
        const [r2] = await this.dataSource.query('SELECT COUNT(*) AS c FROM pedidos');
        await this.dataSource.query('DELETE FROM pedidos');
        resultado.pedidos = Number(r2.c);
        resultado.pedido_detalles = Number(r1.c);
      }

      if (opciones.caja) {
        const [r1] = await this.dataSource.query('SELECT COUNT(*) AS c FROM movimientos_caja');
        await this.dataSource.query('DELETE FROM movimientos_caja');
        resultado.movimientos_caja = Number(r1.c);
        // Reset cajas to estado abierto y saldo inicial
        await this.dataSource.query(
          `UPDATE cajas SET saldo_actual = saldo_inicial, estado = 'abierta'`,
        );
      }

      if (opciones.inventario) {
        const [r1] = await this.dataSource.query('SELECT COUNT(*) AS c FROM movimientos_inventario');
        await this.dataSource.query('DELETE FROM movimientos_inventario');
        resultado.movimientos_inventario = Number(r1.c);
      }

      if (opciones.productos) {
        const [r1] = await this.dataSource.query('SELECT COUNT(*) AS c FROM producto_tienda');
        await this.dataSource.query('DELETE FROM producto_tienda');
        const [r2] = await this.dataSource.query('SELECT COUNT(*) AS c FROM productos');
        await this.dataSource.query('DELETE FROM productos');
        resultado.producto_tienda = Number(r1.c);
        resultado.productos = Number(r2.c);
      }

      if (opciones.categorias) {
        const [r1] = await this.dataSource.query('SELECT COUNT(*) AS c FROM categorias');
        await this.dataSource.query('DELETE FROM categorias');
        resultado.categorias = Number(r1.c);
      }
    } finally {
      await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    this.logger.log(`Limpieza demo: ${JSON.stringify(resultado)}`);
    return resultado;
  }

  // Cron: check every hour if it's time for the scheduled backup
  @Cron('0 * * * *')
  async scheduledBackup() {
    try {
      const config = await this.getConfig();
      if (!config.auto_backup_enabled) return;

      const [h] = config.auto_backup_hora.split(':').map(Number);
      if (new Date().getHours() !== h) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (config.ultimo_backup_at && new Date(config.ultimo_backup_at) >= today) return;

      this.logger.log('Ejecutando respaldo automatico...');
      const tipo = config.incluir_db && config.incluir_excel ? 'completo' : config.incluir_db ? 'db' : 'excel';
      await this.ejecutarBackup(tipo);
    } catch (e) {
      this.logger.error(`Auto backup error: ${e.message}`);
    }
  }
}
