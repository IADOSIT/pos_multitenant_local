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
exports.NotificacionesService = void 0;
const common_1 = require("@nestjs/common");
let NotificacionesService = class NotificacionesService {
    constructor() {
        this.logger = new common_1.Logger('NotificacionesService');
        this.connections = new Map();
        this.keepaliveInterval = setInterval(() => {
            this.connections.forEach((conns) => {
                conns.forEach((res) => {
                    try {
                        res.write(': keepalive\n\n');
                    }
                    catch { }
                });
            });
        }, 30000);
    }
    addConnection(tiendaId, res) {
        if (!this.connections.has(tiendaId)) {
            this.connections.set(tiendaId, new Set());
        }
        this.connections.get(tiendaId).add(res);
        this.logger.log(`SSE connection added for tienda ${tiendaId} (total: ${this.connections.get(tiendaId).size})`);
        res.on('close', () => {
            this.connections.get(tiendaId)?.delete(res);
            this.logger.log(`SSE connection removed for tienda ${tiendaId}`);
        });
    }
    emitToTienda(tiendaId, event, data) {
        const conns = this.connections.get(tiendaId);
        if (!conns || conns.size === 0)
            return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        conns.forEach((res) => {
            try {
                res.write(payload);
            }
            catch { }
        });
        this.logger.log(`SSE event '${event}' emitted to tienda ${tiendaId} (${conns.size} clients)`);
    }
};
exports.NotificacionesService = NotificacionesService;
exports.NotificacionesService = NotificacionesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NotificacionesService);
//# sourceMappingURL=notificaciones.service.js.map