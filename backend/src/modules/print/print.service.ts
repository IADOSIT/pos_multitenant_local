import { Injectable, Logger } from '@nestjs/common';

interface PrintJob {
  id: string;
  content: string;
  status: 'pending' | 'printing' | 'done' | 'error';
  retries: number;
  error?: string;
  createdAt: Date;
}

@Injectable()
export class PrintService {
  private logger = new Logger('PrintService');
  private queue: PrintJob[] = [];
  private maxRetries = 3;

  async print(content: string, printerConfig?: any): Promise<PrintJob> {
    const job: PrintJob = {
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

  private async processJob(job: PrintJob, config?: any) {
    try {
      job.status = 'printing';

      if (config?.type === 'escpos') {
        await this.printEscPos(job.content, config);
      } else {
        // Fallback: guardar para impresión por navegador
        this.logger.log(`Print job ${job.id}: contenido listo para impresión por navegador`);
      }

      job.status = 'done';
      this.logger.log(`Print job ${job.id} completado`);
    } catch (err) {
      job.retries++;
      job.error = err.message;
      if (job.retries < this.maxRetries) {
        this.logger.warn(`Print job ${job.id} reintento ${job.retries}/${this.maxRetries}`);
        setTimeout(() => this.processJob(job, config), 2000);
      } else {
        job.status = 'error';
        this.logger.error(`Print job ${job.id} falló: ${err.message}`);
      }
    }
  }

  private async printEscPos(content: string, config: any) {
    // ESC/POS via USB/Network - requiere hardware conectado
    // En desarrollo, solo logea. En producción con hardware:
    // const escpos = require('escpos');
    // const device = new escpos.USB(); // o new escpos.Network(config.ip)
    // const printer = new escpos.Printer(device);
    // device.open(() => { printer.text(content).cut().close(); });
    this.logger.log('ESC/POS print simulado (sin hardware conectado)');
  }

  getQueue() {
    return this.queue.slice(-20);
  }

  getJob(id: string) {
    return this.queue.find(j => j.id === id);
  }
}
