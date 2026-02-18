import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private ds: DataSource) {}

  @Get()
  async check() {
    try {
      await this.ds.query('SELECT 1');
      return {
        status: 'ok',
        app: 'POS-iaDoS',
        brand: 'iaDoS',
        db: 'connected',
        db_host: process.env.DB_HOST || 'localhost',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'error',
        db: 'disconnected',
        error: err.message,
      };
    }
  }
}
