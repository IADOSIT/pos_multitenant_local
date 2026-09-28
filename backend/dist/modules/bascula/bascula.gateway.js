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
exports.BasculaGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_bascula_entity_1 = require("./config-bascula.entity");
let BasculaGateway = class BasculaGateway {
    constructor(configRepo) {
        this.configRepo = configRepo;
        this.bridgeMap = new Map();
    }
    handleDisconnect(client) {
        const info = this.bridgeMap.get(client.id);
        this.bridgeMap.delete(client.id);
        if (info)
            this.difundirBasculas(info.tienda_id);
    }
    basculasDe(tiendaId) {
        const out = [];
        for (const [socketId, info] of this.bridgeMap) {
            if (info.tienda_id === tiendaId)
                out.push({ bridge_id: socketId, estacion: info.estacion });
        }
        return out.sort((a, b) => a.estacion.localeCompare(b.estacion));
    }
    difundirBasculas(tiendaId) {
        this.server.to(`tienda:${tiendaId}`).emit('basculas-update', { basculas: this.basculasDe(tiendaId) });
    }
    async handleBridgeJoin(client, data) {
        const config = await this.configRepo.findOne({ where: { tienda_token: data.tienda_token } });
        const habilitado = !!config && (config.activo || config.usar_en_pos || config.cajon_activo);
        if (!habilitado) {
            client.emit('bridge-error', { message: 'Token invalido o hardware local desactivado' });
            return;
        }
        const estacion = (data.estacion || '').toString().trim().slice(0, 40) || 'Principal';
        client.join(`tienda:${config.tienda_id}`);
        this.bridgeMap.set(client.id, { tienda_id: config.tienda_id, estacion });
        client.emit('bridge-welcome', { tienda_id: config.tienda_id, estacion });
        this.difundirBasculas(config.tienda_id);
    }
    handleKioskJoin(client, data) {
        client.join(`tienda:${data.tienda_id}`);
        client.emit('kiosk-welcome', { tienda_id: data.tienda_id });
        client.emit('basculas-update', { basculas: this.basculasDe(data.tienda_id) });
    }
    handleBasculasListar(client, data) {
        client.emit('basculas-update', { basculas: this.basculasDe(data.tienda_id) });
    }
    handleBridgeWeight(client, data) {
        const info = this.bridgeMap.get(client.id);
        if (!info)
            return;
        this.server.to(`tienda:${info.tienda_id}`).emit('weight-update', {
            ...data,
            estacion: info.estacion,
            bridge_id: client.id,
        });
    }
    emitOpenDrawer(tiendaId, payload = {}) {
        this.server.to(`tienda:${tiendaId}`).emit('open-drawer', payload);
    }
    emitPrintLabel(tiendaId, payload) {
        this.server.to(`tienda:${tiendaId}`).emit('print-label', payload);
    }
};
exports.BasculaGateway = BasculaGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], BasculaGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('bridge-join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BasculaGateway.prototype, "handleBridgeJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('kiosk-join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], BasculaGateway.prototype, "handleKioskJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('basculas-listar'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], BasculaGateway.prototype, "handleBasculasListar", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('bridge-weight'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], BasculaGateway.prototype, "handleBridgeWeight", null);
exports.BasculaGateway = BasculaGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' }, namespace: '/bascula' }),
    __param(0, (0, typeorm_1.InjectRepository)(config_bascula_entity_1.ConfigBascula)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BasculaGateway);
//# sourceMappingURL=bascula.gateway.js.map