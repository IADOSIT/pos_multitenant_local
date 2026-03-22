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
exports.BackupController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const backup_service_1 = require("./backup.service");
let BackupController = class BackupController {
    constructor(backupService) {
        this.backupService = backupService;
    }
    getConfig() {
        return this.backupService.getConfig();
    }
    updateConfig(body) {
        return this.backupService.updateConfig(body);
    }
    getLogs() {
        return this.backupService.getLogs();
    }
    listFiles() {
        return this.backupService.listFiles();
    }
    ejecutar(body, req) {
        return this.backupService.ejecutarBackup(body.tipo || 'completo', req.user, body.tienda_id || undefined);
    }
    download(filename, res) {
        const fp = this.backupService.getFilePath(filename);
        if (!fp)
            return res.status(404).json({ message: 'Archivo no encontrado' });
        res.download(fp, filename);
    }
    deleteLog(id) {
        return this.backupService.deleteLog(id);
    }
    restaurar(body) {
        return this.backupService.restaurarBackup(body.filename);
    }
    importarSQL(file) {
        if (!file)
            throw new common_1.BadRequestException('No se recibio archivo');
        if (!file.originalname.endsWith('.sql'))
            throw new common_1.BadRequestException('Solo se permiten archivos .sql');
        return this.backupService.importarSQLBuffer(file.buffer);
    }
    limpiarDemo(body) {
        return this.backupService.limpiarDemoData(body);
    }
};
exports.BackupController = BackupController;
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('files'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "listFiles", null);
__decorate([
    (0, common_1.Post)('ejecutar'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "ejecutar", null);
__decorate([
    (0, common_1.Get)('download/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "download", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "deleteLog", null);
__decorate([
    (0, common_1.Post)('restaurar'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "restaurar", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "importarSQL", null);
__decorate([
    (0, common_1.Post)('limpiar-demo'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "limpiarDemo", null);
exports.BackupController = BackupController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('backup'),
    __metadata("design:paramtypes", [backup_service_1.BackupService])
], BackupController);
//# sourceMappingURL=backup.controller.js.map