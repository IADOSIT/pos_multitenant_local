"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BackupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const backup_config_entity_1 = require("./entities/backup-config.entity");
const backup_log_entity_1 = require("./entities/backup-log.entity");
let BackupService = BackupService_1 = class BackupService {
    constructor(configRepo, logRepo, dataSource) {
        this.configRepo = configRepo;
        this.logRepo = logRepo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(BackupService_1.name);
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
    async getConfig() {
        let config = await this.configRepo.findOne({ where: { id: 1 } });
        if (!config)
            config = await this.configRepo.save(this.configRepo.create({}));
        return config;
    }
    async updateConfig(data) {
        const config = await this.getConfig();
        Object.assign(config, data);
        return this.configRepo.save(config);
    }
    async getLogs(limit = 60) {
        return this.logRepo.find({ order: { created_at: 'DESC' }, take: limit });
    }
    listFiles() {
        try {
            return fs.readdirSync(this.backupsDir)
                .filter((f) => f.endsWith('.sql') || f.endsWith('.xlsx'))
                .map((f) => {
                const stat = fs.statSync(path.join(this.backupsDir, f));
                return { archivo: f, tamano: stat.size, fecha: stat.mtime };
            })
                .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        }
        catch {
            return [];
        }
    }
    escape(v) {
        if (v === null || v === undefined)
            return 'NULL';
        if (typeof v === 'boolean')
            return v ? '1' : '0';
        if (typeof v === 'number')
            return String(v);
        if (v instanceof Date)
            return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
        const s = String(v);
        return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
    }
    rowsToSQL(table, rows) {
        if (!rows.length)
            return `-- ${table}: sin datos\n`;
        const cols = Object.keys(rows[0]).map((k) => `\`${k}\``).join(', ');
        const inserts = rows.map((r) => {
            const vals = Object.values(r).map((v) => this.escape(v)).join(', ');
            return `INSERT IGNORE INTO \`${table}\` (${cols}) VALUES (${vals});`;
        });
        return `-- ${table}: ${rows.length} filas\n${inserts.join('\n')}\n\n`;
    }
    async dumpTable(table, sql, params) {
        try {
            const rows = await this.dataSource.query(sql, params);
            return this.rowsToSQL(table, rows);
        }
        catch (e) {
            this.logger.warn(`Backup skip ${table}: ${e.message}`);
            return `-- ${table}: omitida (${e.message})\n\n`;
        }
    }
    async realizarBackupSQL(scope, tiendaFilter) {
        const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const scopeLabel = tiendaFilter
            ? `t${tiendaFilter}`
            : scope.empresa_id
                ? `e${scope.empresa_id}`
                : `ten${scope.tenant_id}`;
        const filename = `backup-${scopeLabel}-${fecha}.sql`;
        const filepath = path.join(this.backupsDir, filename);
        const parts = [
            '-- POS-iaDoS Backup SQL (generado sin mysqldump)',
            `-- Fecha: ${new Date().toISOString()}`,
            `-- Empresa: ${scope.empresa_id ?? 'todas'} | Tienda filtro: ${tiendaFilter ?? 'todas'}`,
            '',
            'SET NAMES utf8mb4;',
            'SET FOREIGN_KEY_CHECKS = 0;',
            '',
        ];
        const eid = scope.empresa_id;
        const tid = tiendaFilter;
        if (tid) {
            parts.push(await this.dumpTable('ventas', 'SELECT * FROM ventas WHERE tienda_id = ?', [tid]));
            parts.push(await this.dumpTable('venta_detalles', 'SELECT d.* FROM venta_detalles d JOIN ventas v ON d.venta_id = v.id WHERE v.tienda_id = ?', [tid]));
            parts.push(await this.dumpTable('venta_pagos', 'SELECT p.* FROM venta_pagos p JOIN ventas v ON p.venta_id = v.id WHERE v.tienda_id = ?', [tid]));
            parts.push(await this.dumpTable('pedidos', 'SELECT * FROM pedidos WHERE tienda_id = ?', [tid]));
            parts.push(await this.dumpTable('pedido_detalles', 'SELECT d.* FROM pedido_detalles d JOIN pedidos p ON d.pedido_id = p.id WHERE p.tienda_id = ?', [tid]));
            parts.push(await this.dumpTable('movimientos_caja', 'SELECT mc.* FROM movimientos_caja mc JOIN cajas c ON mc.caja_id = c.id WHERE c.tienda_id = ?', [tid]));
            parts.push(await this.dumpTable('movimientos_inventario', 'SELECT * FROM movimientos_inventario WHERE tienda_id = ?', [tid]));
        }
        else if (eid) {
            parts.push(await this.dumpTable('ventas', 'SELECT v.* FROM ventas v JOIN tiendas t ON v.tienda_id = t.id WHERE t.empresa_id = ?', [eid]));
            parts.push(await this.dumpTable('venta_detalles', 'SELECT d.* FROM venta_detalles d JOIN ventas v ON d.venta_id = v.id JOIN tiendas t ON v.tienda_id = t.id WHERE t.empresa_id = ?', [eid]));
            parts.push(await this.dumpTable('venta_pagos', 'SELECT p.* FROM venta_pagos p JOIN ventas v ON p.venta_id = v.id JOIN tiendas t ON v.tienda_id = t.id WHERE t.empresa_id = ?', [eid]));
            parts.push(await this.dumpTable('pedidos', 'SELECT p.* FROM pedidos p JOIN tiendas t ON p.tienda_id = t.id WHERE t.empresa_id = ?', [eid]));
            parts.push(await this.dumpTable('pedido_detalles', 'SELECT d.* FROM pedido_detalles d JOIN pedidos p ON d.pedido_id = p.id JOIN tiendas t ON p.tienda_id = t.id WHERE t.empresa_id = ?', [eid]));
            parts.push(await this.dumpTable('movimientos_caja', 'SELECT mc.* FROM movimientos_caja mc JOIN cajas c ON mc.caja_id = c.id JOIN tiendas t ON c.tienda_id = t.id WHERE t.empresa_id = ?', [eid]));
            parts.push(await this.dumpTable('movimientos_inventario', 'SELECT mi.* FROM movimientos_inventario mi JOIN tiendas t ON mi.tienda_id = t.id WHERE t.empresa_id = ?', [eid]));
            parts.push(await this.dumpTable('categorias', 'SELECT * FROM categorias WHERE empresa_id = ?', [eid]));
            parts.push(await this.dumpTable('productos', 'SELECT * FROM productos WHERE empresa_id = ?', [eid]));
            parts.push(await this.dumpTable('producto_tienda', 'SELECT pt.* FROM producto_tienda pt JOIN productos p ON pt.producto_id = p.id WHERE p.empresa_id = ?', [eid]));
        }
        parts.push('SET FOREIGN_KEY_CHECKS = 1;');
        parts.push('-- Fin del backup POS-iaDoS');
        fs.writeFileSync(filepath, parts.join('\n'), 'utf8');
        const stats = fs.statSync(filepath);
        return { archivo: filename, tamano: stats.size };
    }
    async realizarBackupExcel(scope, tiendaFilter) {
        const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const scopeLabel = tiendaFilter ? `t${tiendaFilter}` : scope.empresa_id ? `e${scope.empresa_id}` : 'full';
        const filename = `backup-excel-${scopeLabel}-${fecha}.xlsx`;
        const filepath = path.join(this.backupsDir, filename);
        const wb = new ExcelJS.Workbook();
        wb.creator = 'POS-iaDoS';
        wb.created = new Date();
        const eid = scope.empresa_id;
        const tid = tiendaFilter;
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
            const ventas = await this.dataSource.query(`SELECT v.folio, v.created_at, v.subtotal, v.impuestos, v.descuento, v.total,
                v.metodo_pago, v.estado,
                u.nombre AS cajero, ti.nombre AS tienda
         FROM ventas v
         LEFT JOIN users u ON v.usuario_id = u.id
         LEFT JOIN tiendas ti ON v.tienda_id = ti.id
         ${ventaWhere}
         ORDER BY v.created_at DESC`, ventaParams);
            wsV.addRows(ventas);
        }
        catch (e) {
            wsV.addRow({ folio: `Error: ${e.message}` });
        }
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
            const detalles = await this.dataSource.query(`SELECT v.folio, d.producto_nombre, d.producto_sku, d.cantidad,
                d.precio_unitario, d.descuento, d.subtotal
         FROM venta_detalles d
         JOIN ventas v ON d.venta_id = v.id
         ${detWhere}
         ORDER BY v.created_at DESC, d.id`, detParams);
            wsD.addRows(detalles);
        }
        catch (e) {
            wsD.addRow({ folio: `Error: ${e.message}` });
        }
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
            const productos = await this.dataSource.query(`SELECT p.sku, p.nombre, c.nombre AS categoria, p.precio, p.costo,
                p.stock_actual, p.activo, p.disponible
         FROM productos p
         LEFT JOIN categorias c ON p.categoria_id = c.id
         ${prodWhere}
         ORDER BY c.nombre, p.nombre`, prodParams);
            wsP.addRows(productos);
        }
        catch (e) {
            wsP.addRow({ sku: `Error: ${e.message}` });
        }
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
            const inv = await this.dataSource.query(`SELECT p.nombre AS producto, p.sku, p.stock_actual, p.stock_minimo
         FROM productos p ${invWhere} ORDER BY p.nombre`, invParams);
            wsI.addRows(inv);
        }
        catch { }
        await wb.xlsx.writeFile(filepath);
        try {
            fs.copyFileSync(filepath, path.join(this.backupsDir, 'respaldo-diario.xlsx'));
        }
        catch { }
        const stats = fs.statSync(filepath);
        return { archivo: filename, tamano: stats.size };
    }
    async ejecutarBackup(tipo, user = {}, tiendaFilter) {
        const config = await this.getConfig();
        const scope = {
            tenant_id: user.tenant_id,
            empresa_id: user.empresa_id,
            tienda_id: user.tienda_id,
            rol: user.rol,
        };
        const logs = [];
        const tipos = [];
        if (tipo === 'db' || tipo === 'completo')
            tipos.push('db');
        if (tipo === 'excel' || tipo === 'completo')
            tipos.push('excel');
        for (const t of tipos) {
            const log = this.logRepo.create({ tipo: t });
            try {
                const result = t === 'db'
                    ? await this.realizarBackupSQL(scope, tiendaFilter)
                    : await this.realizarBackupExcel(scope, tiendaFilter);
                log.archivo = result.archivo;
                log.tamano_bytes = result.tamano;
                log.estado = 'ok';
                if (config.onedrive_enabled && config.onedrive_carpeta) {
                    try {
                        const dest = path.join(config.onedrive_carpeta, result.archivo);
                        fs.copyFileSync(path.join(this.backupsDir, result.archivo), dest);
                        log.onedrive_copiado = true;
                    }
                    catch (e) {
                        this.logger.warn(`Copy to carpeta_destino failed: ${e.message}`);
                    }
                }
            }
            catch (e) {
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
    async limpiarAntiguos(dias) {
        const cutoff = Date.now() - dias * 24 * 60 * 60 * 1000;
        try {
            const files = fs.readdirSync(this.backupsDir);
            for (const f of files) {
                if (f === 'respaldo-diario.xlsx')
                    continue;
                const fp = path.join(this.backupsDir, f);
                if (fs.statSync(fp).mtimeMs < cutoff) {
                    fs.unlinkSync(fp);
                    await this.logRepo.delete({ archivo: f });
                }
            }
        }
        catch (e) {
            this.logger.warn(`Cleanup error: ${e.message}`);
        }
    }
    getFilePath(filename) {
        const fp = path.join(this.backupsDir, path.basename(filename));
        return fs.existsSync(fp) ? fp : null;
    }
    async deleteLog(id) {
        const log = await this.logRepo.findOne({ where: { id } });
        if (!log)
            return { deleted: false };
        const fp = path.join(this.backupsDir, log.archivo);
        try {
            if (fs.existsSync(fp))
                fs.unlinkSync(fp);
        }
        catch { }
        await this.logRepo.remove(log);
        return { deleted: true };
    }
    async restaurarBackup(filename) {
        const safe = path.basename(filename);
        if (!safe.endsWith('.sql'))
            throw new Error('Solo se pueden restaurar archivos .sql');
        const filepath = path.join(this.backupsDir, safe);
        if (!fs.existsSync(filepath))
            throw new Error(`Archivo no encontrado: ${safe}`);
        const content = fs.readFileSync(filepath, 'utf8');
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
                }
                catch (e) {
                    this.logger.warn(`Restore statement skip: ${e.message} — ${stmt.slice(0, 80)}`);
                }
            }
        }
        finally {
            await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
        }
        this.logger.log(`Restauracion completada: ${safe} — ${count} statements ejecutados`);
        return { ok: true, mensaje: `Restaurado desde ${safe} (${count} registros importados)` };
    }
    async importarSQLBuffer(buffer) {
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
                }
                catch (e) {
                    this.logger.warn(`Import statement skip: ${e.message} — ${stmt.slice(0, 80)}`);
                }
            }
        }
        finally {
            await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
        }
        this.logger.log(`Importacion desde archivo: ${count} statements ejecutados`);
        return { ok: true, mensaje: `Importacion completada (${count} registros procesados)` };
    }
    async limpiarDemoData(opciones) {
        const resultado = {};
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
                await this.dataSource.query(`UPDATE cajas SET total_ventas = 0, total_entradas = 0, total_salidas = 0,
           total_esperado = NULL, total_real = NULL, diferencia = NULL,
           fecha_apertura = NULL, fecha_cierre = NULL, estado = 'cerrada'`);
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
        }
        finally {
            await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
        }
        this.logger.log(`Limpieza demo: ${JSON.stringify(resultado)}`);
        return resultado;
    }
    async scheduledBackup() {
        try {
            const config = await this.getConfig();
            if (!config.auto_backup_enabled)
                return;
            const [h] = config.auto_backup_hora.split(':').map(Number);
            if (new Date().getHours() !== h)
                return;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (config.ultimo_backup_at && new Date(config.ultimo_backup_at) >= today)
                return;
            this.logger.log('Ejecutando respaldo automatico...');
            const tipo = config.incluir_db && config.incluir_excel ? 'completo' : config.incluir_db ? 'db' : 'excel';
            await this.ejecutarBackup(tipo, {});
        }
        catch (e) {
            this.logger.error(`Auto backup error: ${e.message}`);
        }
    }
};
exports.BackupService = BackupService;
__decorate([
    (0, schedule_1.Cron)('0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupService.prototype, "scheduledBackup", null);
exports.BackupService = BackupService = BackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(backup_config_entity_1.BackupConfig)),
    __param(1, (0, typeorm_1.InjectRepository)(backup_log_entity_1.BackupLog)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], BackupService);
//# sourceMappingURL=backup.service.js.map