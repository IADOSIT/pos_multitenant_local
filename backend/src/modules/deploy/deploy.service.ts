import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppDeploy } from './app-deploy.entity';

@Injectable()
export class DeployService implements OnModuleInit {
  private logger = new Logger('DeployService');

  constructor(@InjectRepository(AppDeploy) private repo: Repository<AppDeploy>) {}

  // Al arrancar el backend (cada boot = un despliegue nuevo): registra la versión que
  // está corriendo (APP_VERSION del contenedor) y marca el despliegue como COMPLETADO.
  async onModuleInit() {
    try {
      const version = process.env.APP_VERSION || '';
      await this.repo.save({ id: 1, version, estado: 'completada', mensaje: null });
      this.logger.log(`Versión desplegada registrada: ${version} (completada)`);
    } catch (e: any) {
      this.logger.warn(`No se pudo registrar la versión de despliegue: ${e.message}`);
    }
  }

  async get() {
    let row = await this.repo.findOne({ where: { id: 1 } });
    if (!row) {
      row = await this.repo.save({ id: 1, version: process.env.APP_VERSION || '', estado: 'completada', mensaje: null });
    }
    return { version: row.version, estado: row.estado, mensaje: row.mensaje, updated_at: row.updated_at };
  }

  async setEstado(estado: 'en_progreso' | 'completada', opts: { version?: string; mensaje?: string } = {}) {
    const row = (await this.repo.findOne({ where: { id: 1 } })) || this.repo.create({ id: 1, version: process.env.APP_VERSION || '' });
    row.estado = estado;
    if (opts.version !== undefined) row.version = opts.version;
    if (opts.mensaje !== undefined) row.mensaje = opts.mensaje;
    await this.repo.save(row);
    return this.get();
  }
}
