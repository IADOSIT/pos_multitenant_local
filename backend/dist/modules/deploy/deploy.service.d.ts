import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AppDeploy } from './app-deploy.entity';
export declare class DeployService implements OnModuleInit {
    private repo;
    private logger;
    constructor(repo: Repository<AppDeploy>);
    onModuleInit(): Promise<void>;
    get(): Promise<{
        version: string;
        estado: "completada" | "en_progreso";
        mensaje: string | null;
        updated_at: Date;
    }>;
    setEstado(estado: 'en_progreso' | 'completada', opts?: {
        version?: string;
        mensaje?: string;
    }): Promise<{
        version: string;
        estado: "completada" | "en_progreso";
        mensaje: string | null;
        updated_at: Date;
    }>;
}
