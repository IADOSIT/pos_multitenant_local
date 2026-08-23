import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MonitorService } from './monitor.service';
export declare const ROOM_MONITOR = "monitor";
export declare function roomsDelNamespace(nsp: Namespace | undefined): Map<string, Set<string>> | undefined;
export declare class MonitorGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly monitor;
    private readonly jwt;
    server: Namespace;
    constructor(monitor: MonitorService, jwt: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handlePantalla(client: Socket, data: {
        ruta?: string;
    }): void;
    handleMonitorJoin(client: Socket): void;
    handleMonitorLeave(client: Socket): void;
    private emitirSiHayMonitores;
}
