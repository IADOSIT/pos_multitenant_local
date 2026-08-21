"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorService = void 0;
const common_1 = require("@nestjs/common");
const RASTRO_MAX = 5;
let MonitorService = class MonitorService {
    constructor() {
        this.sesiones = new Map();
    }
    alta(socketId, identidad, dispositivo, rutaInicial) {
        const ahora = Date.now();
        const sesion = {
            socket_id: socketId,
            ...identidad,
            dispositivo,
            pantalla_actual: rutaInicial,
            pantalla_desde: ahora,
            conectado_desde: ahora,
            rastro: [rutaInicial],
        };
        this.sesiones.set(socketId, sesion);
        return sesion;
    }
    baja(socketId) {
        const sesion = this.sesiones.get(socketId);
        if (!sesion)
            return null;
        this.sesiones.delete(socketId);
        return sesion;
    }
    cambiarPantalla(socketId, ruta) {
        const sesion = this.sesiones.get(socketId);
        if (!sesion)
            return null;
        if (sesion.pantalla_actual === ruta)
            return null;
        sesion.pantalla_actual = ruta;
        sesion.pantalla_desde = Date.now();
        sesion.rastro = [...sesion.rastro, ruta].slice(-RASTRO_MAX);
        return { socket_id: socketId, ruta, desde: sesion.pantalla_desde };
    }
    getSesion(socketId) {
        return this.sesiones.get(socketId);
    }
    snapshot() {
        const porTienda = new Map();
        for (const sesion of this.sesiones.values()) {
            if (!porTienda.has(sesion.tienda_id))
                porTienda.set(sesion.tienda_id, new Map());
            const usuarios = porTienda.get(sesion.tienda_id);
            if (!usuarios.has(sesion.usuario_id)) {
                usuarios.set(sesion.usuario_id, {
                    usuario_id: sesion.usuario_id,
                    nombre: sesion.nombre,
                    rol: sesion.rol,
                    sesiones: [],
                });
            }
            usuarios.get(sesion.usuario_id).sesiones.push(sesion);
        }
        const grupos = [...porTienda.entries()]
            .map(([tienda_id, usuarios]) => ({
            tienda_id,
            usuarios: [...usuarios.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
        }))
            .sort((a, b) => {
            if (a.tienda_id === null)
                return 1;
            if (b.tienda_id === null)
                return -1;
            return a.tienda_id - b.tienda_id;
        });
        const usuariosUnicos = new Set([...this.sesiones.values()].map(s => s.usuario_id));
        return {
            grupos,
            total_usuarios: usuariosUnicos.size,
            total_sesiones: this.sesiones.size,
            total_tiendas: grupos.filter(g => g.tienda_id !== null).length,
        };
    }
};
exports.MonitorService = MonitorService;
exports.MonitorService = MonitorService = __decorate([
    (0, common_1.Injectable)()
], MonitorService);
//# sourceMappingURL=monitor.service.js.map