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
    generateTicketData(venta: any, config: TicketConfig): {
        lines: string[];
        raw: string;
    };
    private center;
    private right;
    private formatLine;
}
