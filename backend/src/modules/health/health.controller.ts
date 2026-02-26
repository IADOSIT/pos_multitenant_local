import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as os from 'os';

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

  @Get('info')
  getInfo() {
    const hostname = os.hostname();
    const port     = Number(process.env.APP_PORT) || 3000;
    const mode     = process.env.INSTALL_MODE || 'local';

    // Obtener IPs locales (excluir loopback y link-local)
    const ips: string[] = [];
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of (interfaces[name] || [])) {
        if (iface.family === 'IPv4' && !iface.internal &&
            !iface.address.startsWith('169.254')) {
          ips.push(iface.address);
        }
      }
    }

    return {
      hostname,
      port,
      mode,
      ips,
      urls: {
        local:    `http://localhost:${port}`,
        hostname: `http://${hostname}:${port}`,
        network:  ips.map(ip => `http://${ip}:${port}`),
      },
    };
  }
}
