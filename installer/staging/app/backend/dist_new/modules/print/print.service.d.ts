export interface PrintJob {
    id: string;
    content: string;
    status: 'pending' | 'printing' | 'done' | 'error';
    retries: number;
    error?: string;
    createdAt: Date;
}
export declare class PrintService {
    private logger;
    private queue;
    private maxRetries;
    print(content: string, printerConfig?: any): Promise<PrintJob>;
    private processJob;
    private printEscPos;
    getQueue(): PrintJob[];
    getJob(id: string): PrintJob | undefined;
}
