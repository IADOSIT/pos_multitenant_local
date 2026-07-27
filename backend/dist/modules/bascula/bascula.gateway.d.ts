import { OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { ConfigBascula } from './config-bascula.entity';
export declare class BasculaGateway implements OnGatewayDisconnect {
    private readonly configRepo;
    server: Server;
    private bridgeMap;
    constructor(configRepo: Repository<ConfigBascula>);
    handleDisconnect(client: Socket): void;
    handleBridgeJoin(client: Socket, data: {
        tienda_token: string;
    }): Promise<void>;
    handleKioskJoin(client: Socket, data: {
        tienda_id: number;
    }): void;
    handleBridgeWeight(client: Socket, data: {
        peso_kg: number;
        estable: boolean;
    }): void;
    emitPrintLabel(tiendaId: number, payload: {
        pagado: boolean;
        folio?: string;
        producto_nombre: string;
        peso_kg: number;
        precio_total: number;
        barcode: string;
        label_width_mm: number;
        label_height_mm: number;
        printer_ip: string | null;
        printer_port: number;
    }): void;
}
