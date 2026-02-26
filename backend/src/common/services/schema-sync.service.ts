import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger('SchemaSync');

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      const opts = this.dataSource.options as any;
      const dbName = opts.database as string;
      const dbHost = opts.host || 'localhost';
      const ambiente =
        dbHost === 'localhost' || dbHost === '127.0.0.1' ? 'LOCAL' : 'EXTERNO';

      // Tablas reales en la BD
      const tableRows: { TABLE_NAME: string }[] = await this.dataSource.query(
        `SELECT TABLE_NAME
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
        [dbName],
      );
      const actualTables = new Set(
        tableRows.map((r) => r.TABLE_NAME.toLowerCase()),
      );

      // Tablas esperadas según las entidades registradas
      const expectedTables = this.dataSource.entityMetadatas.map((m) =>
        m.tableName.toLowerCase(),
      );

      const missing = expectedTables.filter((t) => !actualTables.has(t));
      const extra = [...actualTables].filter(
        (t) => !expectedTables.includes(t),
      );

      // ── Columnas: verificar que todas las columnas de entidades existen ──
      const colRows: { TABLE_NAME: string; COLUMN_NAME: string }[] =
        await this.dataSource.query(
          `SELECT TABLE_NAME, COLUMN_NAME
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = ?`,
          [dbName],
        );
      const actualCols = new Map<string, Set<string>>();
      for (const row of colRows) {
        const tbl = row.TABLE_NAME.toLowerCase();
        if (!actualCols.has(tbl)) actualCols.set(tbl, new Set());
        actualCols.get(tbl)!.add(row.COLUMN_NAME.toLowerCase());
      }

      const missingCols: string[] = [];
      for (const meta of this.dataSource.entityMetadatas) {
        const tbl = meta.tableName.toLowerCase();
        const dbCols = actualCols.get(tbl);
        if (!dbCols) continue; // la tabla era nueva, ya la creó TypeORM
        for (const col of meta.columns) {
          const colName = col.databaseName.toLowerCase();
          if (!dbCols.has(colName)) {
            missingCols.push(`${tbl}.${colName}`);
          }
        }
      }

      // ── Reporte final ──
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log(`  Ambiente : ${ambiente}`);
      this.logger.log(`  BD       : ${dbName} @ ${dbHost}`);
      this.logger.log(
        `  Tablas   : ${actualTables.size} en BD | ${expectedTables.length} en entidades`,
      );

      if (missing.length > 0) {
        this.logger.warn(
          `  Tablas nuevas creadas por TypeORM: ${missing.join(', ')}`,
        );
      }
      if (missingCols.length > 0) {
        this.logger.warn(
          `  Columnas nuevas agregadas por TypeORM: ${missingCols.join(', ')}`,
        );
      }
      if (extra.length > 0) {
        this.logger.log(
          `  Tablas extra en BD (no en entidades): ${extra.join(', ')}`,
        );
      }

      const allOk = missing.length === 0 && missingCols.length === 0;
      if (allOk) {
        this.logger.log('  Schema   : OK - Todo sincronizado correctamente');
      } else {
        this.logger.log(
          '  Schema   : Sincronizado - Se aplicaron cambios (ver arriba)',
        );
      }
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      this.logger.error(`Error en verificacion de schema: ${error.message}`);
    }
  }
}
