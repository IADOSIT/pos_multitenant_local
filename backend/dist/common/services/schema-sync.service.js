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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let SchemaSyncService = class SchemaSyncService {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.logger = new common_1.Logger('SchemaSync');
    }
    async onApplicationBootstrap() {
        try {
            const opts = this.dataSource.options;
            const dbName = opts.database;
            const dbHost = opts.host || 'localhost';
            const ambiente = dbHost === 'localhost' || dbHost === '127.0.0.1' ? 'LOCAL' : 'EXTERNO';
            const tableRows = await this.dataSource.query(`SELECT TABLE_NAME
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`, [dbName]);
            const actualTables = new Set(tableRows.map((r) => r.TABLE_NAME.toLowerCase()));
            const expectedTables = this.dataSource.entityMetadatas.map((m) => m.tableName.toLowerCase());
            const missing = expectedTables.filter((t) => !actualTables.has(t));
            const extra = [...actualTables].filter((t) => !expectedTables.includes(t));
            const colRows = await this.dataSource.query(`SELECT TABLE_NAME, COLUMN_NAME
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = ?`, [dbName]);
            const actualCols = new Map();
            for (const row of colRows) {
                const tbl = row.TABLE_NAME.toLowerCase();
                if (!actualCols.has(tbl))
                    actualCols.set(tbl, new Set());
                actualCols.get(tbl).add(row.COLUMN_NAME.toLowerCase());
            }
            const missingCols = [];
            for (const meta of this.dataSource.entityMetadatas) {
                const tbl = meta.tableName.toLowerCase();
                const dbCols = actualCols.get(tbl);
                if (!dbCols)
                    continue;
                for (const col of meta.columns) {
                    const colName = col.databaseName.toLowerCase();
                    if (!dbCols.has(colName)) {
                        missingCols.push(`${tbl}.${colName}`);
                    }
                }
            }
            this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            this.logger.log(`  Ambiente : ${ambiente}`);
            this.logger.log(`  BD       : ${dbName} @ ${dbHost}`);
            this.logger.log(`  Tablas   : ${actualTables.size} en BD | ${expectedTables.length} en entidades`);
            if (missing.length > 0) {
                this.logger.warn(`  Tablas nuevas creadas por TypeORM: ${missing.join(', ')}`);
            }
            if (missingCols.length > 0) {
                this.logger.warn(`  Columnas nuevas agregadas por TypeORM: ${missingCols.join(', ')}`);
            }
            if (extra.length > 0) {
                this.logger.log(`  Tablas extra en BD (no en entidades): ${extra.join(', ')}`);
            }
            const allOk = missing.length === 0 && missingCols.length === 0;
            if (allOk) {
                this.logger.log('  Schema   : OK - Todo sincronizado correctamente');
            }
            else {
                this.logger.log('  Schema   : Sincronizado - Se aplicaron cambios (ver arriba)');
            }
            this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        catch (error) {
            this.logger.error(`Error en verificacion de schema: ${error.message}`);
        }
    }
    async keepAlive() {
        try {
            await this.dataSource.query('SELECT 1');
        }
        catch {
        }
    }
};
exports.SchemaSyncService = SchemaSyncService;
__decorate([
    (0, schedule_1.Cron)('*/4 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchemaSyncService.prototype, "keepAlive", null);
exports.SchemaSyncService = SchemaSyncService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], SchemaSyncService);
//# sourceMappingURL=schema-sync.service.js.map