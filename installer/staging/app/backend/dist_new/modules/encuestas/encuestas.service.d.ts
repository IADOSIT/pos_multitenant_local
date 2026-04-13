import { Repository } from 'typeorm';
import { EncuestaServicio } from './encuesta.entity';
export declare class EncuestasService {
    private repo;
    constructor(repo: Repository<EncuestaServicio>);
    create(data: Partial<EncuestaServicio>): Promise<EncuestaServicio>;
    findByPedido(pedido_id: number): Promise<EncuestaServicio | null>;
    responder(pedido_id: number, data: {
        calificacion_servicio: number;
        calificacion_comida: number;
        comentario?: string;
    }): Promise<EncuestaServicio | null>;
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
    findAll(scope: any, limit?: number): Promise<EncuestaServicio[]>;
}
