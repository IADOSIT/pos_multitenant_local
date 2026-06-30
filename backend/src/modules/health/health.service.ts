import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  private readonly logger = new Logger('HealthService');

  constructor(@InjectDataSource() private ds: DataSource) {}

  // Mantiene el pool de conexiones MySQL activo para evitar ECONNRESET por idle timeout
  @Cron('*/30 * * * * *')
  async keepAlive() {
    try {
      await this.ds.query('SELECT 1');
    } catch (err) {
      this.logger.warn(`[keepAlive] MySQL connection lost: ${err.message} — el pool reconectará`);
    }
  }
}
