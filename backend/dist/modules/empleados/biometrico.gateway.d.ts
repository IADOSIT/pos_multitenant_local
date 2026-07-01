import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { BiometricoService } from './biometrico.service';
import { EmpleadosService } from './empleados.service';
import { ConfigBiometrico } from './config-biometrico.entity';
export declare class BiometricoGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly biometricoService;
    private readonly empleadosService;
    private readonly configRepo;
    server: Server;
    private bridgeMap;
    constructor(biometricoService: BiometricoService, empleadosService: EmpleadosService, configRepo: Repository<ConfigBiometrico>);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleBridgeJoin(client: Socket, data: {
        empresa_token: string;
    }): Promise<void>;
    handleLiveJoin(client: Socket, data: {
        empresa_token: string;
    }): Promise<void>;
    handleBridgeMatch(client: Socket, data: {
        empleado_id: number;
        timestamp?: string;
    }): Promise<void>;
    handleBridgeFmd(client: Socket, data: {
        fmdB64: string;
        timestamp?: string;
    }): Promise<void>;
    handleEnrollStart(client: Socket, data: {
        empleado_id: number;
        empresa_token: string;
    }): Promise<void>;
    handleEnrollDone(client: Socket, data: {
        empleado_id: number;
        fmdB64: string;
    }): Promise<void>;
}
