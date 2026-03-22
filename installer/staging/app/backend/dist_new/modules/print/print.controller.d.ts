import { PrintService } from './print.service';
export declare class PrintController {
    private service;
    constructor(service: PrintService);
    print(data: {
        content: string;
        config?: any;
    }): Promise<import("./print.service").PrintJob>;
    getQueue(): import("./print.service").PrintJob[];
    getJob(id: string): import("./print.service").PrintJob | undefined;
}
