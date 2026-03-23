import { TicketsService } from './tickets.service';
export declare class TicketsController {
    private service;
    constructor(service: TicketsService);
    getConfig(scope: any): Promise<import("./ticket-config.entity").TicketConfig>;
    saveConfig(data: any): Promise<import("./ticket-config.entity").TicketConfig>;
    updateConfig(id: number, data: any): Promise<import("./ticket-config.entity").TicketConfig | null>;
    uploadLogo(file: Express.Multer.File): Promise<{
        logo_url: string;
    }>;
    preview(data: any, scope: any): Promise<{
        ancho_papel: number;
        fuente_familia: string;
        fuente_tamano: number;
        logo_posicion: string;
        logo_url: string | null;
        lines: string[];
        raw: string;
    }>;
}
