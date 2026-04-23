import { EncuestasService } from './encuestas.service';
export declare class EncuestasController {
    private service;
    constructor(service: EncuestasService);
    findAll(scope: any, limit?: string): Promise<import("./encuesta.entity").EncuestaServicio[]>;
    getKPIs(scope: any, desde?: string, hasta?: string): Promise<{
        total: number;
        promedio_servicio: number;
        promedio_comida: number;
        por_mesero: {
            mesero_id: number;
            mesero_nombre: string;
            total_encuestas: number;
            promedio_servicio: number;
            promedio_comida: number;
        }[];
    }>;
}
