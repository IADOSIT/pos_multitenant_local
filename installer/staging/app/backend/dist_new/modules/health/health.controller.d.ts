import { DataSource } from 'typeorm';
export declare class HealthController {
    private ds;
    constructor(ds: DataSource);
    check(): Promise<{
        status: string;
        app: string;
        brand: string;
        db: string;
        db_host: string;
        version: string;
        timestamp: string;
        error?: undefined;
    } | {
        status: string;
        db: string;
        error: any;
        app?: undefined;
        brand?: undefined;
        db_host?: undefined;
        version?: undefined;
        timestamp?: undefined;
    }>;
    getInfo(): {
        hostname: string;
        port: number;
        mode: string;
        ips: string[];
        urls: {
            local: string;
            hostname: string;
            network: string[];
        };
    };
}
