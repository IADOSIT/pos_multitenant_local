import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SftpClient = require('ssh2-sftp-client');
import { BackupConfig } from './entities/backup-config.entity';
import { BackupLog } from './entities/backup-log.entity';

interface BackupScope {
  tenant_id?: number;
  empresa_id?: number;
  tienda_id?: number;
  rol?: string;
}

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  readonly backupsDir: string;

  constructor(
    @InjectRepository(BackupConfig) private configRepo: Repository<BackupConfig>,
    @InjectRepository(BackupLog) private logRepo: Repository<BackupLog>,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    // Dentro de uploads/ → cae en el volumen Docker pos_uploads y en el EXE bajo C:\POS-iaDoS\app\backend\uploads\
    this.backupsDir = path.join(process.cwd(), 'uploads', 'respaldos');
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

  // ─────────────────────────────────────────────────────────────
  // SQL Escape / helpers
  // ─────────────────────────────────────────────────────────────
  private escape(v: any): string {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'boolean') return v ? '1' : '0';
    if (typeof v === 'number') return String(v);
    if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
    const s = String(v);
    return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
  }

  private rowsToSQL(table: string, rows: any[]): string {
    if (!rows.length) return `-- ${table}: sin datos\n`;
    const cols = Object.keys(rows[0]).map((k) => `\`${k}\``).join(', ');
    const inserts = rows.map((r) => {
      const vals = Object.values(r).map((v) => this.escape(v)).join(', ');
      return `INSERT IGNORE INTO \`${table}\` (${cols}) VALUES (${vals});`;
    });
    return `-- ${table}: ${rows.length} filas\n${inserts.join('\n')}\n\n`;
  }

  private async dumpTable(table: string, sql: string, params: any[]): Promise<string> {
    try {
      const rows = await this.dataSource.query(sql, params);
      return this.rowsToSQL(table, rows);
    } catch (e) {
      this.logger.warn(`Backup skip ${table}: ${e.message}`);
      return `-- ${table}: omitida (${e.message})\n\n`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers: sanitize nombre para filename, DELETE+INSERT dump
  // ─────────────────────────────────────────────────────────────
  private sanitizeName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40);
  }

  private async dumpDeleteInsert(
    table: string,
    selectSql: string,
    params: any[],
    deleteWhere: string,
  ): Promise<string> {
    try {
      const rows = await this.dataSource.query(selectSql, params);
      if (!rows.length) return `-- ${table}: sin datos\n\n`;
      const cols = Object.keys(rows[0]).map((k) => `\`${k}\``).join(', ');
      const inserts = rows.map((r) => {
        const vals = Object.values(r).map((v) => this.escape(v)).join(', ');
        return `INSERT INTO \`${table}\` (${cols}) VALUES (${vals});`;
      });
      return [
        `-- === ${table}: ${rows.length} filas ===`,
        `DELETE FROM \`${table}\` WHERE ${deleteWhere};`,
        ...inserts,
        '',
        '',
      ].join('\n');
    } catch (e) {
      this.logger.warn(`Backup skip ${table}: ${e.message}`);
      return `-- ${table}: omitida (${e.message})\n\n`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SQL Backup completo por tienda (DELETE + INSERT)
  // Nombre del archivo = nombre de la tienda + fecha
  // ─────────────────────────────────────────────────────────────
  private async realizarBackupSQL(scope: BackupScope, tiendaFilter?: number): Promise<{ archivo: string; tamano: number }> {
    // Fallback: si no hay filtro explícito, usar la tienda del usuario autenticado
    const tid = tiendaFilter ?? scope.tienda_id;
    const eid = scope.empresa_id;

    // Resolver nombre de tienda/empresa para el filename
    let label = 'backup';
    let empresaId = eid;

    if (tid) {
      const [t] = await this.dataSource.query(
        'SELECT nombre, empresa_id FROM tiendas WHERE id = ?', [tid],
      );
      if (t) { label = this.sanitizeName(t.nombre); empresaId = t.empresa_id; }
    } else if (eid) {
      const [e] = await this.dataSource.query('SELECT nombre FROM empresas WHERE id = ?', [eid]);
      if (e) label = this.sanitizeName(e.nombre);
    }

    const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${label}-${fecha}.sql`;
    const filepath = path.join(this.backupsDir, filename);

    const parts: string[] = [
      '-- POS-iaDoS Backup Completo (DELETE + INSERT)',
      `-- TIENDA: ${label}`,
      `-- TIENDA_ID: ${tid ?? 'null'}`,
      `-- EMPRESA_ID: ${empresaId ?? 'null'}`,
      `-- TENANT_ID: ${scope.tenant_id ?? 'null'}`,
      `-- FECHA: ${new Date().toISOString()}`,
      '',
      'SET NAMES utf8mb4;',
      'SET FOREIGN_KEY_CHECKS = 0;',
      '',
    ];

    if (tid && empresaId) {
      // ── Config de la tienda ────────────────────────────────
      parts.push(await this.dumpDeleteInsert('tiendas',
        'SELECT * FROM tiendas WHERE id = ?', [tid], `id = ${tid}`));
      parts.push(await this.dumpDeleteInsert('cajas',
        'SELECT * FROM cajas WHERE tienda_id = ?', [tid], `tienda_id = ${tid}`));
      parts.push(await this.dumpDeleteInsert('mesas',
        'SELECT * FROM mesas WHERE tienda_id = ?', [tid], `tienda_id = ${tid}`));
      parts.push(await this.dumpDeleteInsert('ticket_configs',
        'SELECT * FROM ticket_configs WHERE tienda_id = ?', [tid], `tienda_id = ${tid}`));
      parts.push(await this.dumpDeleteInsert('gateway_configs',
        'SELECT * FROM gateway_configs WHERE tienda_id = ?', [tid], `tienda_id = ${tid}`));
      parts.push(await this.dumpDeleteInsert('menu_digital_config',
        'SELECT * FROM menu_digital_config WHERE tienda_id = ?', [tid], `tienda_id = ${tid}`));

      // ── Catálogo de la empresa ─────────────────────────────
      parts.push(await this.dumpDeleteInsert('categorias',
        'SELECT * FROM categorias WHERE empresa_id = ?', [empresaId], `empresa_id = ${empresaId}`));
      parts.push(await this.dumpDeleteInsert('productos',
        'SELECT * FROM productos WHERE empresa_id = ?', [empresaId], `empresa_id = ${empresaId}`));
      parts.push(await this.dumpDeleteInsert('producto_tienda',
        'SELECT pt.* FROM producto_tienda pt JOIN productos p ON pt.producto_id = p.id WHERE p.empresa_id = ?',
        [empresaId], `producto_id IN (SELECT id FROM productos WHERE empresa_id = ${empresaId})`));

      // ── Operacional ────────────────────────────────────────
      parts.push(await this.dumpDeleteInsert('ventas',
        'SELECT * FROM ventas WHERE tienda_id = ?', [tid], `tienda_id = ${tid}`));
      parts.push(await this.dumpDeleteInsert('venta_detalles',
        'SELECT d.* FROM venta_detalles d JOIN ventas v ON d.venta_id = v.id WHERE v.tienda_id = ?',
        [tid], `venta_id IN (SELECT id FROM ventas WHERE tienda_id = ${tid})`));
      parts.push(await this.dumpDeleteInsert('venta_pagos',
        'SELECT p.* FROM venta_pagos p JOIN ventas v ON p.venta_id = v.id WHERE v.tienda_id = ?',
        [tid], `venta_id IN (SELECT id FROM ventas WHERE tienda_id = ${tid})`));
      parts.push(await this.dumpDeleteInsert('pedidos',
        'SELECT * FROM pedidos WHERE tienda_id = ?', [tid], `tienda_id = ${tid}`));
      parts.push(await this.dumpDeleteInsert('pedido_detalles',
        'SELECT d.* FROM pedido_detalles d JOIN pedidos p ON d.pedido_id = p.id WHERE p.tienda_id = ?',
        [tid], `pedido_id IN (SELECT id FROM pedidos WHERE tienda_id = ${tid})`));
      parts.push(await this.dumpDeleteInsert('movimientos_caja',
        'SELECT mc.* FROM movimientos_caja mc JOIN cajas c ON mc.caja_id = c.id WHERE c.tienda_id = ?',
        [tid], `caja_id IN (SELECT id FROM cajas WHERE tienda_id = ${tid})`));
      parts.push(await this.dumpDeleteInsert('movimientos_inventario',
        'SELECT * FROM movimientos_inventario WHERE tienda_id = ?', [tid], `tienda_id = ${tid}`));
      parts.push(await this.dumpDeleteInsert('encuestas_servicio',
        'SELECT es.* FROM encuestas_servicio es JOIN pedidos p ON es.pedido_id = p.id WHERE p.tienda_id = ?',
        [tid], `pedido_id IN (SELECT id FROM pedidos WHERE tienda_id = ${tid})`));

    } else if (eid) {
      // Empresa completa — todas las tiendas con config + catálogo + operacional
      parts.push(await this.dumpDeleteInsert('tiendas',
        'SELECT * FROM tiendas WHERE empresa_id = ?', [eid], `empresa_id = ${eid}`));
      parts.push(await this.dumpDeleteInsert('cajas',
        'SELECT c.* FROM cajas c JOIN tiendas t ON c.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `tienda_id IN (SELECT id FROM tiendas WHERE empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('mesas',
        'SELECT m.* FROM mesas m JOIN tiendas t ON m.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `tienda_id IN (SELECT id FROM tiendas WHERE empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('ticket_configs',
        'SELECT tc.* FROM ticket_configs tc JOIN tiendas t ON tc.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `tienda_id IN (SELECT id FROM tiendas WHERE empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('gateway_configs',
        'SELECT gc.* FROM gateway_configs gc JOIN tiendas t ON gc.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `tienda_id IN (SELECT id FROM tiendas WHERE empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('menu_digital_config',
        'SELECT mc.* FROM menu_digital_config mc JOIN tiendas t ON mc.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `tienda_id IN (SELECT id FROM tiendas WHERE empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('categorias',
        'SELECT * FROM categorias WHERE empresa_id = ?', [eid], `empresa_id = ${eid}`));
      parts.push(await this.dumpDeleteInsert('productos',
        'SELECT * FROM productos WHERE empresa_id = ?', [eid], `empresa_id = ${eid}`));
      parts.push(await this.dumpDeleteInsert('producto_tienda',
        'SELECT pt.* FROM producto_tienda pt JOIN productos p ON pt.producto_id = p.id WHERE p.empresa_id = ?',
        [eid], `producto_id IN (SELECT id FROM productos WHERE empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('ventas',
        'SELECT v.* FROM ventas v JOIN tiendas t ON v.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `tienda_id IN (SELECT id FROM tiendas WHERE empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('venta_detalles',
        'SELECT d.* FROM venta_detalles d JOIN ventas v ON d.venta_id = v.id JOIN tiendas t ON v.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `venta_id IN (SELECT id FROM ventas v2 JOIN tiendas t ON v2.tienda_id = t.id WHERE t.empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('venta_pagos',
        'SELECT p.* FROM venta_pagos p JOIN ventas v ON p.venta_id = v.id JOIN tiendas t ON v.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `venta_id IN (SELECT id FROM ventas v2 JOIN tiendas t ON v2.tienda_id = t.id WHERE t.empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('pedidos',
        'SELECT p.* FROM pedidos p JOIN tiendas t ON p.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `tienda_id IN (SELECT id FROM tiendas WHERE empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('pedido_detalles',
        'SELECT d.* FROM pedido_detalles d JOIN pedidos p ON d.pedido_id = p.id JOIN tiendas t ON p.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `pedido_id IN (SELECT id FROM pedidos p2 JOIN tiendas t ON p2.tienda_id = t.id WHERE t.empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('movimientos_caja',
        'SELECT mc.* FROM movimientos_caja mc JOIN cajas c ON mc.caja_id = c.id JOIN tiendas t ON c.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `caja_id IN (SELECT id FROM cajas c2 JOIN tiendas t ON c2.tienda_id = t.id WHERE t.empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('movimientos_inventario',
        'SELECT mi.* FROM movimientos_inventario mi JOIN tiendas t ON mi.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `tienda_id IN (SELECT id FROM tiendas WHERE empresa_id = ${eid})`));
      parts.push(await this.dumpDeleteInsert('encuestas_servicio',
        'SELECT es.* FROM encuestas_servicio es JOIN pedidos p ON es.pedido_id = p.id JOIN tiendas t ON p.tienda_id = t.id WHERE t.empresa_id = ?',
        [eid], `pedido_id IN (SELECT id FROM pedidos p2 JOIN tiendas t ON p2.tienda_id = t.id WHERE t.empresa_id = ${eid})`));
    }

    parts.push('SET FOREIGN_KEY_CHECKS = 1;');
    parts.push('-- FIN DEL BACKUP POS-iaDoS');

    fs.writeFileSync(filepath, parts.join('\n'), 'utf8');
    const stats = fs.statSync(filepath);
    return { archivo: filename, tamano: stats.size };
  }

  // ─────────────────────────────────────────────────────────────
  // Excel Backup — filtrado por scope
  // ─────────────────────────────────────────────────────────────
  private async realizarBackupExcel(scope: BackupScope, tiendaFilter?: number): Promise<{ archivo: string; tamano: number }> {
    const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const scopeLabel = tiendaFilter ? `t${tiendaFilter}` : scope.empresa_id ? `e${scope.empresa_id}` : 'full';
    const filename = `backup-excel-${scopeLabel}-${fecha}.xlsx`;
    const filepath = path.join(this.backupsDir, filename);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'POS-iaDoS';
    wb.created = new Date();

    const eid = scope.empresa_id;
    const tid = tiendaFilter;

    // ── Ventas ─────────────────────────────────────────────────
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
      const ventaWhere = tid
        ? 'WHERE v.tienda_id = ?'
        : eid ? 'JOIN tiendas t ON v.tienda_id = t.id WHERE t.empresa_id = ?' : '';
      const ventaParams = (tid || eid) ? [tid || eid] : [];
      const ventas = await this.dataSource.query(
        `SELECT v.folio, v.created_at, v.subtotal, v.impuestos, v.descuento, v.total,
                v.metodo_pago, v.estado,
                u.nombre AS cajero, ti.nombre AS tienda
         FROM ventas v
         LEFT JOIN users u ON v.usuario_id = u.id
         LEFT JOIN tiendas ti ON v.tienda_id = ti.id
         ${ventaWhere}
         ORDER BY v.created_at DESC`, ventaParams,
      );
      wsV.addRows(ventas);
    } catch (e) { wsV.addRow({ folio: `Error: ${e.message}` }); }

    // ── Detalle Ventas ─────────────────────────────────────────
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
      const detWhere = tid
        ? 'WHERE v.tienda_id = ?'
        : eid ? 'JOIN tiendas t ON v.tienda_id = t.id WHERE t.empresa_id = ?' : '';
      const detParams = (tid || eid) ? [tid || eid] : [];
      const detalles = await this.dataSource.query(
        `SELECT v.folio, d.producto_nombre, d.producto_sku, d.cantidad,
                d.precio_unitario, d.descuento, d.subtotal
         FROM venta_detalles d
         JOIN ventas v ON d.venta_id = v.id
         ${detWhere}
         ORDER BY v.created_at DESC, d.id`, detParams,
      );
      wsD.addRows(detalles);
    } catch (e) { wsD.addRow({ folio: `Error: ${e.message}` }); }

    // ── Productos ──────────────────────────────────────────────
    const wsP = wb.addWorksheet('Productos');
    wsP.columns = [
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Nombre', key: 'nombre', width: 32 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Precio', key: 'precio', width: 12 },
      { header: 'Costo', key: 'costo', width: 12 },
      { header: 'Stock', key: 'stock_actual', width: 10 },
      { header: 'Activo', key: 'activo', width: 8 },
      { header: 'Disponible', key: 'disponible', width: 10 },
    ];
    wsP.getRow(1).font = { bold: true };
    try {
      const prodWhere = tid
        ? 'WHERE p.empresa_id IN (SELECT empresa_id FROM tiendas WHERE id = ?)'
        : eid ? 'WHERE p.empresa_id = ?' : '';
      const prodParams = (tid || eid) ? [tid || eid] : [];
      const productos = await this.dataSource.query(
        `SELECT p.sku, p.nombre, c.nombre AS categoria, p.precio, p.costo,
                p.stock_actual, p.activo, p.disponible
         FROM productos p
         LEFT JOIN categorias c ON p.categoria_id = c.id
         ${prodWhere}
         ORDER BY c.nombre, p.nombre`, prodParams,
      );
      wsP.addRows(productos);
    } catch (e) { wsP.addRow({ sku: `Error: ${e.message}` }); }

    // ── Inventario ─────────────────────────────────────────────
    const wsI = wb.addWorksheet('Inventario');
    wsI.columns = [
      { header: 'Producto', key: 'producto', width: 32 },
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Stock Actual', key: 'stock_actual', width: 14 },
      { header: 'Stock Min', key: 'stock_minimo', width: 12 },
    ];
    wsI.getRow(1).font = { bold: true };
    try {
      const invWhere = tid
        ? 'WHERE p.empresa_id IN (SELECT empresa_id FROM tiendas WHERE id = ?) AND p.controla_stock = 1'
        : eid ? 'WHERE p.empresa_id = ? AND p.controla_stock = 1' : 'WHERE p.controla_stock = 1';
      const invParams = (tid || eid) ? [tid || eid] : [];
      const inv = await this.dataSource.query(
        `SELECT p.nombre AS producto, p.sku, p.stock_actual, p.stock_minimo
         FROM productos p ${invWhere} ORDER BY p.nombre`, invParams,
      );
      wsI.addRows(inv);
    } catch { /* omitir silenciosamente */ }

    await wb.xlsx.writeFile(filepath);

    // Copia fija respaldo-diario.xlsx en la raíz del directorio de respaldos
    try {
      fs.copyFileSync(filepath, path.join(this.backupsDir, 'respaldo-diario.xlsx'));
    } catch { /* ignorar si no hay permisos */ }

    const stats = fs.statSync(filepath);
    return { archivo: filename, tamano: stats.size };
  }

  // ─────────────────────────────────────────────────────────────
  // FileBrowser API helpers
  // sftp_host = URL base  ej: https://sftp.iados.online
  // sftp_directorio = carpeta remota  ej: /pos-iados/backups
  // ─────────────────────────────────────────────────────────────
  private async fileBrowserLogin(config: BackupConfig): Promise<string> {
    let base = (config.sftp_host || '').trim().replace(/\/$/, '');
    if (base && !base.startsWith('http')) base = `https://${base}`;
    const res = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: config.sftp_usuario, password: config.sftp_password }),
    });
    if (!res.ok) throw new Error(`Login FileBrowser fallido (${res.status})`);
    return res.text(); // devuelve el JWT como texto plano
  }

  private async fileBrowserMkdir(base: string, token: string, remotePath: string): Promise<void> {
    // FileBrowser crea directorio con POST al path terminado en /
    const url = `${base}/api/resources${remotePath}/`;
    const res = await fetch(url, { method: 'POST', headers: { 'X-Auth': token } });
    // 200 = created, 409 = ya existe — ambos son OK
    if (!res.ok && res.status !== 409) {
      this.logger.warn(`FileBrowser mkdir ${remotePath}: ${res.status}`);
    }
  }

  private async uploadViaFileBrowser(config: BackupConfig, localFile: string, filename: string): Promise<void> {
    let base = (config.sftp_host || '').trim().replace(/\/$/, '');
    if (base && !base.startsWith('http')) base = `https://${base}`;
    const token = await this.fileBrowserLogin(config);
    const remoteDir = (config.sftp_directorio || '/pos-iados/backups').replace(/\/$/, '');

    await this.fileBrowserMkdir(base, token, remoteDir);

    const fileBuffer = fs.readFileSync(localFile);
    const remotePath = `${remoteDir}/${filename}`;
    const res = await fetch(`${base}/api/resources${remotePath}?override=true`, {
      method: 'POST',
      headers: { 'X-Auth': token, 'Content-Type': 'application/octet-stream' },
      body: fileBuffer,
    });
    if (!res.ok) throw new Error(`FileBrowser upload fallido (${res.status}): ${await res.text()}`);
    this.logger.log(`FileBrowser upload OK: ${remotePath}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Test FileBrowser — login + listar directorio
  // ─────────────────────────────────────────────────────────────
  async testSFTP(): Promise<{ ok: boolean; mensaje: string; detalle?: string }> {
    const config = await this.getConfig();

    // Paso 1: validar que haya config
    if (!config.sftp_host || !config.sftp_usuario || !config.sftp_password) {
      return {
        ok: false,
        mensaje: 'Faltan credenciales',
        detalle: `sftp_host="${config.sftp_host}" usuario="${config.sftp_usuario}" pass=${config.sftp_password ? '***' : 'VACIO'}`,
      };
    }

    let base = (config.sftp_host || '').trim().replace(/\/$/, '');
    if (base && !base.startsWith('http')) base = `https://${base}`;
    const remoteDir = (config.sftp_directorio || '/pos-iados/backups').replace(/\/$/, '');
    const loginUrl = `${base}/api/login`;

    // Paso 2: login
    let token: string;
    try {
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: config.sftp_usuario, password: config.sftp_password }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { ok: false, mensaje: `Login fallido (HTTP ${res.status})`, detalle: `URL: ${loginUrl} | Respuesta: ${body.slice(0, 200)}` };
      }
      token = await res.text();
    } catch (e) {
      const cause = (e as any)?.cause;
      const causeMsg = cause ? ` | Causa: ${cause.code || cause.message || JSON.stringify(cause)}` : '';
      return { ok: false, mensaje: `No se pudo conectar al servidor FileBrowser`, detalle: `URL: ${loginUrl} | Error: ${e.message}${causeMsg}` };
    }

    // Paso 3: crear directorio
    try {
      await this.fileBrowserMkdir(base, token, remoteDir);
    } catch (e) {
      return { ok: false, mensaje: `Directorio no accesible`, detalle: `Dir: ${remoteDir} | Error: ${e.message}` };
    }

    // Paso 4: listar directorio
    try {
      const res = await fetch(`${base}/api/resources${remoteDir}/`, { headers: { 'X-Auth': token } });
      if (!res.ok && res.status !== 404) {
        return { ok: false, mensaje: `No se puede listar directorio (HTTP ${res.status})`, detalle: `${base}/api/resources${remoteDir}/` };
      }
    } catch (e) {
      return { ok: false, mensaje: `Error listando directorio`, detalle: e.message };
    }

    this.logger.log(`FileBrowser test OK: ${base} dir=${remoteDir}`);
    return { ok: true, mensaje: `Conexion exitosa a ${base} — directorio ${remoteDir} listo` };
  }

  // ─────────────────────────────────────────────────────────────
  // Validar backup antes de restaurar
  // Verifica: archivo legible, metadatos, BD accesible, tienda existe
  // ─────────────────────────────────────────────────────────────
  async validarBackup(filename: string): Promise<{ ok: boolean; info: any; error?: string }> {
    const safe = path.basename(filename);
    if (!safe.endsWith('.sql')) return { ok: false, info: null, error: 'Solo archivos .sql' };
    const filepath = path.join(this.backupsDir, safe);
    if (!fs.existsSync(filepath)) return { ok: false, info: null, error: 'Archivo no encontrado' };

    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n').slice(0, 10);
    const meta: any = { archivo: safe };
    for (const line of lines) {
      const m1 = line.match(/^-- TIENDA: (.+)$/);       if (m1) meta.tienda_nombre = m1[1].trim();
      const m2 = line.match(/^-- TIENDA_ID: (.+)$/);    if (m2) meta.tienda_id = m2[1].trim();
      const m3 = line.match(/^-- EMPRESA_ID: (.+)$/);   if (m3) meta.empresa_id = m3[1].trim();
      const m4 = line.match(/^-- FECHA: (.+)$/);        if (m4) meta.fecha_backup = m4[1].trim();
    }
    meta.total_inserts = (content.match(/^INSERT INTO/gm) || []).length;
    meta.total_deletes = (content.match(/^DELETE FROM/gm) || []).length;
    meta.tamano_bytes = fs.statSync(filepath).size;

    // Verificar BD accesible
    try {
      await this.dataSource.query('SELECT 1');
      meta.db_ok = true;
    } catch {
      return { ok: false, info: meta, error: 'No se puede conectar a la base de datos' };
    }

    // Verificar que la tienda existe en la BD actual
    if (meta.tienda_id && meta.tienda_id !== 'null') {
      try {
        const [t] = await this.dataSource.query(
          'SELECT nombre FROM tiendas WHERE id = ?', [parseInt(meta.tienda_id)],
        );
        meta.tienda_actual = t?.nombre || '⚠️ Tienda no encontrada en BD actual';
      } catch { meta.tienda_actual = 'Error verificando tienda'; }
    }

    return { ok: true, info: meta };
  }

  // ─────────────────────────────────────────────────────────────
  // Ejecutar backup (punto de entrada principal)
  // ─────────────────────────────────────────────────────────────
  async ejecutarBackup(tipo: 'db' | 'excel' | 'completo', user: any = {}, tiendaFilter?: number): Promise<BackupLog[]> {
    const config = await this.getConfig();
    const scope: BackupScope = {
      tenant_id: user.tenant_id,
      empresa_id: user.empresa_id,
      tienda_id: user.tienda_id,
      rol: user.rol,
    };

    const logs: BackupLog[] = [];
    const tipos: ('db' | 'excel')[] = [];
    if (tipo === 'db' || tipo === 'completo') tipos.push('db');
    if (tipo === 'excel' || tipo === 'completo') tipos.push('excel');

    for (const t of tipos) {
      const log = this.logRepo.create({ tipo: t });
      try {
        const result = t === 'db'
          ? await this.realizarBackupSQL(scope, tiendaFilter)
          : await this.realizarBackupExcel(scope, tiendaFilter);

        log.archivo = result.archivo;
        log.tamano_bytes = result.tamano;
        log.estado = 'ok';

        // Copiar a carpeta externa (OneDrive, USB, red local) si configurada
        if (config.onedrive_enabled && config.onedrive_carpeta) {
          try {
            const dest = path.join(config.onedrive_carpeta, result.archivo);
            fs.copyFileSync(path.join(this.backupsDir, result.archivo), dest);
            log.onedrive_copiado = true;
          } catch (e) {
            this.logger.warn(`Copy to carpeta_destino failed: ${e.message}`);
          }
        }

        // Subir a FileBrowser si está habilitado
        if (config.sftp_enabled && config.sftp_host && config.sftp_usuario && config.sftp_password) {
          try {
            const localPath = path.join(this.backupsDir, result.archivo);
            await this.uploadViaFileBrowser(config, localPath, result.archivo);
            log.sftp_subido = true;
          } catch (e) {
            this.logger.warn(`FileBrowser upload failed: ${e.message}`);
            log.sftp_error = e.message;
          }
        }
      } catch (e) {
        log.archivo = '';
        log.estado = 'error';
        log.error_msg = e.message;
        this.logger.error(`Backup error (${t}): ${e.message}`);
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
        if (f === 'respaldo-diario.xlsx') continue; // no borrar el fijo
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

  // ─────────────────────────────────────────────────────────────
  // Restaurar: importa el SQL ejecutando cada statement via DataSource
  // (funciona en VPS Docker, local dev y EXE — sin mysql binario)
  // ─────────────────────────────────────────────────────────────
  async restaurarBackup(filename: string): Promise<{ ok: boolean; mensaje: string }> {
    const safe = path.basename(filename);
    if (!safe.endsWith('.sql')) throw new Error('Solo se pueden restaurar archivos .sql');
    const filepath = path.join(this.backupsDir, safe);
    if (!fs.existsSync(filepath)) throw new Error(`Archivo no encontrado: ${safe}`);

    const content = fs.readFileSync(filepath, 'utf8');
    // Dividir en statements individuales (separados por ;)
    const statements = content
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'));

    await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    let count = 0;
    try {
      for (const stmt of statements) {
        try {
          await this.dataSource.query(stmt);
          count++;
        } catch (e) {
          this.logger.warn(`Restore statement skip: ${e.message} — ${stmt.slice(0, 80)}`);
        }
      }
    } finally {
      await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    this.logger.log(`Restauracion completada: ${safe} — ${count} statements ejecutados`);
    return { ok: true, mensaje: `Restaurado desde ${safe} (${count} registros importados)` };
  }

  async importarSQLBuffer(buffer: Buffer): Promise<{ ok: boolean; mensaje: string }> {
    const content = buffer.toString('utf8');
    const statements = content
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'));

    await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    let count = 0;
    try {
      for (const stmt of statements) {
        try {
          await this.dataSource.query(stmt);
          count++;
        } catch (e) {
          this.logger.warn(`Import statement skip: ${e.message} — ${stmt.slice(0, 80)}`);
        }
      }
    } finally {
      await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    this.logger.log(`Importacion desde archivo: ${count} statements ejecutados`);
    return { ok: true, mensaje: `Importacion completada (${count} registros procesados)` };
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
        await this.dataSource.query(
          `UPDATE cajas SET total_ventas = 0, total_entradas = 0, total_salidas = 0,
           total_esperado = NULL, total_real = NULL, diferencia = NULL,
           fecha_apertura = NULL, fecha_cierre = NULL, estado = 'cerrada'`,
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

  // Cron: cada hora revisa si es hora del respaldo automático
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
      await this.ejecutarBackup(tipo, {});
    } catch (e) {
      this.logger.error(`Auto backup error: ${e.message}`);
    }
  }
}
