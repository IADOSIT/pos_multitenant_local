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
exports.NotificacionesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const notificaciones_service_1 = require("./notificaciones.service");
let NotificacionesController = class NotificacionesController {
    constructor(service, jwtService) {
        this.service = service;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger('NotificacionesController');
    }
    sse(req, res) {
        const token = req.query.token;
        if (!token) {
            res.status(401).json({ message: 'Token requerido' });
            return;
        }
        let payload;
        try {
            payload = this.jwtService.verify(token);
        }
        catch {
            res.status(401).json({ message: 'Token invalido' });
            return;
        }
        const tiendaId = payload.tienda_id;
        if (!tiendaId) {
            res.status(400).json({ message: 'tienda_id no encontrado en token' });
            return;
        }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        res.write(`event: connected\ndata: ${JSON.stringify({ status: 'ok', tienda_id: tiendaId })}\n\n`);
        this.service.addConnection(tiendaId, res);
        this.logger.log(`SSE client connected: user ${payload.sub} tienda ${tiendaId}`);
    }
};
exports.NotificacionesController = NotificacionesController;
__decorate([
    (0, common_1.Get)('sse'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NotificacionesController.prototype, "sse", null);
exports.NotificacionesController = NotificacionesController = __decorate([
    (0, common_1.Controller)('notificaciones'),
    __metadata("design:paramtypes", [notificaciones_service_1.NotificacionesService,
        jwt_1.JwtService])
], NotificacionesController);
//# sourceMappingURL=notificaciones.controller.js.map