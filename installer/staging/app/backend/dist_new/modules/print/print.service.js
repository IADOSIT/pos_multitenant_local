"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintService = void 0;
const common_1 = require("@nestjs/common");
let PrintService = class PrintService {
    constructor() {
        this.logger = new common_1.Logger('PrintService');
        this.queue = [];
        this.maxRetries = 3;
    }
    async print(content, printerConfig) {
        const job = {
            id: `PJ-${Date.now()}`,
            content,
            status: 'pending',
            retries: 0,
            createdAt: new Date(),
        };
        this.queue.push(job);
        this.processJob(job, printerConfig);
        return job;
    }
    async processJob(job, config) {
        try {
            job.status = 'printing';
            if (config?.type === 'escpos') {
                await this.printEscPos(job.content, config);
            }
            else {
                this.logger.log(`Print job ${job.id}: contenido listo para impresión por navegador`);
            }
            job.status = 'done';
            this.logger.log(`Print job ${job.id} completado`);
        }
        catch (err) {
            job.retries++;
            job.error = err.message;
            if (job.retries < this.maxRetries) {
                this.logger.warn(`Print job ${job.id} reintento ${job.retries}/${this.maxRetries}`);
                setTimeout(() => this.processJob(job, config), 2000);
            }
            else {
                job.status = 'error';
                this.logger.error(`Print job ${job.id} falló: ${err.message}`);
            }
        }
    }
    async printEscPos(content, config) {
        this.logger.log('ESC/POS print simulado (sin hardware conectado)');
    }
    getQueue() {
        return this.queue.slice(-20);
    }
    getJob(id) {
        return this.queue.find(j => j.id === id);
    }
};
exports.PrintService = PrintService;
exports.PrintService = PrintService = __decorate([
    (0, common_1.Injectable)()
], PrintService);
//# sourceMappingURL=print.service.js.map