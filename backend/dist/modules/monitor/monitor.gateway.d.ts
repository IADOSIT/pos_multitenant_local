import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MonitorService } from './monitor.service';
export declare class MonitorGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly monitor;
    private readonly jwt;
    server: Server;
    constructor(monitor: MonitorService, jwt: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handlePantalla(client: Socket, data: {
        ruta?: string;
    }): void;
    handleMonitorJoin(client: Socket): void;
    private emitirSiHayMonitores;
}
