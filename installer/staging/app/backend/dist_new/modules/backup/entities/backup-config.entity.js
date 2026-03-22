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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupConfig = void 0;
const typeorm_1 = require("typeorm");
let BackupConfig = class BackupConfig {
};
exports.BackupConfig = BackupConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BackupConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], BackupConfig.prototype, "auto_backup_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, default: '02:00' }),
    __metadata("design:type", String)
], BackupConfig.prototype, "auto_backup_hora", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 7 }),
    __metadata("design:type", Number)
], BackupConfig.prototype, "retencion_dias", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], BackupConfig.prototype, "incluir_db", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], BackupConfig.prototype, "incluir_excel", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BackupConfig.prototype, "onedrive_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], BackupConfig.prototype, "onedrive_carpeta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], BackupConfig.prototype, "ultimo_backup_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], BackupConfig.prototype, "ultimo_backup_estado", void 0);
exports.BackupConfig = BackupConfig = __decorate([
    (0, typeorm_1.Entity)('backup_configs')
], BackupConfig);
//# sourceMappingURL=backup-config.entity.js.map