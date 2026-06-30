import { DataSource } from 'typeorm';
export declare class HealthService {
    private ds;
    private readonly logger;
    constructor(ds: DataSource);
    keepAlive(): Promise<void>;
}
