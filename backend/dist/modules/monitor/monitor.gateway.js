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
exports.MonitorGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const monitor_service_1 = require("./monitor.service");
const user_agent_util_1 = require("./user-agent.util");
const ROOM_MONITOR = 'monitor';
let MonitorGateway = class MonitorGateway {
    constructor(monitor, jwt) {
        this.monitor = monitor;
        this.jwt = jwt;
    }
    handleConnection(client) {
        const token = client.handshake.auth?.token;
        let payload;
        try {
            payload = this.jwt.verify(token);
        }
        catch {
            client.disconnect(true);
            return;
        }
        const identidad = {
            usuario_id: payload.sub,
            nombre: payload.nombre || payload.email || 'Sin nombre',
            rol: payload.rol,
            tenant_id: payload.tenant_id,
            empresa_id: payload.empresa_id,
            tienda_id: payload.tienda_id ?? null,
        };
        const dispositivo = (0, user_agent_util_1.parseUserAgent)(client.handshake.headers['user-agent']);
        const rutaInicial = client.handshake.auth?.ruta || '/';
        const sesion = this.monitor.alta(client.id, identidad, dispositivo, rutaInicial);
        this.emitirSiHayMonitores('presencia:alta', sesion);
    }
    handleDisconnect(client) {
        const sesion = this.monitor.baja(client.id);
        if (sesion)
            this.emitirSiHayMonitores('presencia:baja', { socket_id: client.id });
    }
    handlePantalla(client, data) {
        if (!data?.ruta)
            return;
        const delta = this.monitor.cambiarPantalla(client.id, data.ruta);
        if (delta)
            this.emitirSiHayMonitores('presencia:pantalla', delta);
    }
    handleMonitorJoin(client) {
        const sesion = this.monitor.getSesion(client.id);
        if (sesion?.rol !== 'superadmin')
            return;
        client.join(ROOM_MONITOR);
        client.emit('presencia:snapshot', this.monitor.snapshot());
    }
    emitirSiHayMonitores(evento, carga) {
        const room = this.server?.sockets?.adapter?.rooms?.get(ROOM_MONITOR);
        if (!room || room.size === 0)
            return;
        this.server.to(ROOM_MONITOR).emit(evento, carga);
    }
};
exports.MonitorGateway = MonitorGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MonitorGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('pantalla'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MonitorGateway.prototype, "handlePantalla", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('monitor-join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MonitorGateway.prototype, "handleMonitorJoin", null);
exports.MonitorGateway = MonitorGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' }, namespace: '/presencia' }),
    __metadata("design:paramtypes", [monitor_service_1.MonitorService,
        jwt_1.JwtService])
], MonitorGateway);
//# sourceMappingURL=monitor.gateway.js.map