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
exports.BridgeDescargaController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_bascula_entity_1 = require("./config-bascula.entity");
const bascula_service_1 = require("./bascula.service");
let BridgeDescargaController = class BridgeDescargaController {
    constructor(service, configRepo) {
        this.service = service;
        this.configRepo = configRepo;
    }
    async descargar(token, res) {
        if (!token || token.length < 16)
            throw new common_1.NotFoundException('Enlace no valido');
        const config = await this.configRepo.findOne({ where: { tienda_token: token } });
        if (!config)
            throw new common_1.NotFoundException('Enlace no valido');
        const ruta = this.service.rutaInstalador();
        if (!ruta) {
            throw new common_1.NotFoundException('El instalador del bridge todavia no esta publicado en el servidor.');
        }
        res.download(ruta, `POS-iaDoS-Bridge__TKN-${token}.exe`);
    }
};
exports.BridgeDescargaController = BridgeDescargaController;
__decorate([
    (0, common_1.Get)('descargar/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BridgeDescargaController.prototype, "descargar", null);
exports.BridgeDescargaController = BridgeDescargaController = __decorate([
    (0, common_1.Controller)('bridge'),
    __param(1, (0, typeorm_1.InjectRepository)(config_bascula_entity_1.ConfigBascula)),
    __metadata("design:paramtypes", [bascula_service_1.BasculaService,
        typeorm_2.Repository])
], BridgeDescargaController);
//# sourceMappingURL=bridge-descarga.controller.js.map