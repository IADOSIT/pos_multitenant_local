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
exports.BiometricoGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const biometrico_service_1 = require("./biometrico.service");
const empleados_service_1 = require("./empleados.service");
const config_biometrico_entity_1 = require("./config-biometrico.entity");
let BiometricoGateway = class BiometricoGateway {
    constructor(biometricoService, empleadosService, configRepo) {
        this.biometricoService = biometricoService;
        this.empleadosService = empleadosService;
        this.configRepo = configRepo;
        this.bridgeMap = new Map();
    }
    handleConnection(client) {
        void client;
    }
    handleDisconnect(client) {
        this.bridgeMap.delete(client.id);
    }
    async handleBridgeJoin(client, data) {
        const config = await this.configRepo.findOne({ where: { empresa_token: data.empresa_token } });
        if (!config || !config.activo) {
            client.emit('bridge-error', { message: 'Token inválido o módulo inactivo' });
            return;
        }
        client.join(`empresa:${config.empresa_id}`);
        this.bridgeMap.set(client.id, { empresa_id: config.empresa_id, empresa_token: data.empresa_token });
        client.emit('bridge-welcome', { empresa_id: config.empresa_id });
    }
    async handleLiveJoin(client, data) {
        const config = await this.configRepo.findOne({ where: { empresa_token: data.empresa_token } });
        if (!config) {
            client.disconnect();
            return;
        }
        client.join(`empresa:${config.empresa_id}`);
        client.emit('live-welcome', { empresa_id: config.empresa_id });
    }
    async handleBridgeMatch(client, data) {
        const info = this.bridgeMap.get(client.id);
        if (!info)
            return;
        const ts = data.timestamp ? new Date(data.timestamp) : new Date();
        try {
            const result = await this.biometricoService.procesarMatch(info.empresa_token, data.empleado_id, ts);
            this.server.to(`empresa:${info.empresa_id}`).emit('attendance-event', {
                ...result.registro,
                nuevo: result.nuevo,
            });
        }
        catch (err) {
            client.emit('bridge-error', { message: err.message });
        }
    }
    async handleBridgeFmd(client, data) {
        const info = this.bridgeMap.get(client.id);
        if (!info)
            return;
        const matchId = await this.biometricoService.matchFmd(info.empresa_id, data.fmdB64);
        if (!matchId) {
            this.server.to(`empresa:${info.empresa_id}`).emit('attendance-event', { resultado: 'no_match', timestamp: new Date() });
            return;
        }
        await this.handleBridgeMatch(client, { empleado_id: matchId, timestamp: data.timestamp });
    }
    async handleEnrollStart(client, data) {
        const config = await this.configRepo.findOne({ where: { empresa_token: data.empresa_token } });
        if (!config) {
            client.emit('enroll-error', { message: 'Configuración no encontrada' });
            return;
        }
        client.join(`empresa:${config.empresa_id}`);
        this.server.to(`empresa:${config.empresa_id}`).emit('bridge-enroll-start', { empleado_id: data.empleado_id });
    }
    async handleEnrollDone(client, data) {
        const info = this.bridgeMap.get(client.id);
        if (!info)
            return;
        try {
            const validacion = await this.biometricoService.validarEnrollment(data.fmdB64, info.empresa_id, data.empleado_id);
            if (!validacion.ok) {
                this.server.to(`empresa:${info.empresa_id}`).emit('enroll-result', { success: false, reason: validacion.reason });
                return;
            }
            const empleado = await this.empleadosService.findById(data.empleado_id);
            const scope = { tenant_id: empleado?.tenant_id, empresa_id: info.empresa_id };
            await this.empleadosService.setFmdTemplate(data.empleado_id, data.fmdB64, scope);
            this.server.to(`empresa:${info.empresa_id}`).emit('enroll-result', { success: true, empleado_id: data.empleado_id });
        }
        catch (err) {
            this.server.to(`empresa:${info.empresa_id}`).emit('enroll-result', { success: false, reason: err.message });
        }
    }
};
exports.BiometricoGateway = BiometricoGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], BiometricoGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('bridge-join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BiometricoGateway.prototype, "handleBridgeJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('live-join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BiometricoGateway.prototype, "handleLiveJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('bridge-match'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BiometricoGateway.prototype, "handleBridgeMatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('bridge-fmd'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BiometricoGateway.prototype, "handleBridgeFmd", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('enroll-start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BiometricoGateway.prototype, "handleEnrollStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('bridge-enroll-done'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BiometricoGateway.prototype, "handleEnrollDone", null);
exports.BiometricoGateway = BiometricoGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' }, namespace: '/biometrico' }),
    __param(2, (0, typeorm_1.InjectRepository)(config_biometrico_entity_1.ConfigBiometrico)),
    __metadata("design:paramtypes", [biometrico_service_1.BiometricoService,
        empleados_service_1.EmpleadosService,
        typeorm_2.Repository])
], BiometricoGateway);
//# sourceMappingURL=biometrico.gateway.js.map