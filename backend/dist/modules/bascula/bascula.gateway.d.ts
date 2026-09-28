import { OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigBascula } from './config-bascula.entity';
export declare class BasculaGateway implements OnGatewayDisconnect {
    private readonly configRepo;
    private readonly jwt;
    server: Server;
    private readonly logger;
    private bridgeMap;
    constructor(configRepo: Repository<ConfigBascula>, jwt: JwtService);
    private modoEstricto;
    private verificarOyente;
    private permitirOyente;
    handleDisconnect(client: Socket): void;
    private basculasDe;
    private difundirBasculas;
    handleBridgeJoin(client: Socket, data: {
        tienda_token: string;
        estacion?: string;
    }): Promise<void>;
    handleKioskJoin(client: Socket, data: {
        tienda_id: number;
    }): void;
    handleBasculasListar(client: Socket, data: {
        tienda_id: number;
    }): void;
    handleBridgeWeight(client: Socket, data: {
        peso_kg: number;
        estable: boolean;
    }): void;
    emitOpenDrawer(tiendaId: number, payload?: {
        cmd?: string;
    }): void;
    emitPrintLabel(tiendaId: number, payload: {
        producto_nombre: string;
        peso_kg: number;
        precio_total: number;
        precio_kg: number;
        barcode: string;
        label_width_mm: number;
        label_height_mm: number;
        printer_modo: string;
        printer_ip: string | null;
        printer_port: number;
        printer_nombre: string | null;
    }): void;
}
