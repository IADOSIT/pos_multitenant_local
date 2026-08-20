import { Repository } from 'typeorm';
import { TicketConfig } from './ticket-config.entity';
export declare class TicketsService {
    private repo;
    constructor(repo: Repository<TicketConfig>);
    getConfig(tenant_id: number, empresa_id: number, tienda_id: number): Promise<TicketConfig>;
    private getDefault;
    saveConfig(data: Partial<TicketConfig>): Promise<TicketConfig>;
    updateConfig(id: number, data: Partial<TicketConfig>): Promise<TicketConfig | null>;
    private s;
    private renderTotal;
    generateTicketData(venta: any, config: TicketConfig, moneda?: {
        activa?: boolean;
        codigo?: string;
        tipo_cambio_actual?: number;
        modo_visualizacion?: string;
    }): {
        lines: string[];
        raw: string;
    };
    generatePreCuentaData(data: any, config: TicketConfig, moneda?: {
        activa?: boolean;
        codigo?: string;
        tipo_cambio_actual?: number;
        modo_visualizacion?: string;
    }): {
        lines: string[];
        raw: string;
    };
    private center;
    private right;
    private money;
    private formatLine;
}
